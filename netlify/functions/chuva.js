const ALLOWED = {ana:['25100000','25090000'],inmet:['A014'],rede_alerta:['CIMEHGO186']};
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','Access-Control-Allow-Origin':'*'};
const respond = (statusCode, obj) => ({statusCode,headers,body:JSON.stringify(obj)});
const fmt = date => date.toISOString().slice(0,16).replace('T',' ');
exports.handler = async event => {
 const {base='',id=''}=event.queryStringParameters||{};
 if(!ALLOWED[base]?.includes(id))return respond(400,{error:'Estação não permitida'});
 const now=new Date(), start=new Date(now.getTime()-72*3600000);
 const url=new URL(`https://intratempo.meioambiente.go.gov.br/api/${base}/${id}`);
 url.searchParams.set('start_time',fmt(start));url.searchParams.set('end_time',fmt(now));
 let error;
 for(let attempt=1;attempt<=2;attempt++){
  try{
   const res=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0 (compatible; ChuvaGoias/8.0)','Referer':'https://intratempo.meioambiente.go.gov.br/dadosmet/tabelas.html'},signal:AbortSignal.timeout(7000)});
   if(!res.ok)throw new Error(`HTTP ${res.status} na origem`);
   const data=await res.json();
   if(!Array.isArray(data))throw new Error('A API não retornou uma lista JSON');
   return respond(200,data);
  }catch(e){error=e.message;if(attempt===1)await new Promise(resolve=>setTimeout(resolve,500));}
 }
 return respond(502,{error:`Falha de comunicação com Intratempo (${id}) após 2 tentativas: ${error}`});
};
