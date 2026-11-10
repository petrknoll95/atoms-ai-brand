"""Measure image placement through PDF forms and transparency soft-mask groups."""
from math import hypot
from pypdf.generic import ContentStream

def image_resolutions(reader):
    identity=(1.,0.,0.,1.,0.,0.)
    records={};visited=set()
    def obj(value):return value.get_object() if hasattr(value,'get_object') else value
    def multiply(a,b):
        return (a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5])
    def number(value):
        ref=getattr(value,'indirect_reference',None)
        return ref.idnum if ref else id(value)
    def image(value,matrix,role):
        value=obj(value);sx=hypot(matrix[0],matrix[1]);sy=hypot(matrix[2],matrix[3])
        if not sx or not sy:raise AssertionError('Degenerate PDF image placement')
        key=(number(value),tuple(round(v,6) for v in matrix))
        records[key]=dict(object=number(value),role=role,width=int(value['/Width']),height=int(value['/Height']),ppi=[float(value['/Width'])*72/sx,float(value['/Height'])*72/sy])
        for key in ['/SMask','/Mask']:
            mask=obj(value.get(key))
            if isinstance(mask,dict) and mask.get('/Subtype')=='/Image':image(mask,matrix,'image alpha/mask')
    def form(value,matrix,resources,role):
        value=obj(value);matrix=multiply(matrix,tuple(map(float,value.get('/Matrix',identity))))
        key=(number(value),tuple(round(v,6) for v in matrix))
        if key in visited:return
        visited.add(key);walk(ContentStream(value,reader),matrix,obj(value.get('/Resources',resources)),role)
    def walk(stream,matrix,resources,role):
        stack=[]
        for args,operator in stream.operations:
            if operator==b'q':stack.append(matrix)
            elif operator==b'Q':matrix=stack.pop()
            elif operator==b'cm':matrix=multiply(matrix,tuple(map(float,args)))
            elif operator==b'Do':
                value=obj(obj(resources['/XObject'])[args[0]])
                if value.get('/Subtype')=='/Form':form(value,matrix,resources,role)
                elif value.get('/Subtype')=='/Image':image(value,matrix,role)
            elif operator==b'gs':
                state=obj(obj(resources['/ExtGState'])[args[0]]);mask=obj(state.get('/SMask'))
                if isinstance(mask,dict) and '/G' in mask:form(mask['/G'],matrix,resources,'transparency soft mask')
    for page in reader.pages:
        unit=float(page.get('/UserUnit',1));walk(page.get_contents(),(unit,0.,0.,unit,0.,0.),obj(page['/Resources']),'page artwork')
    return list(records.values())
