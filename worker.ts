import { pool }  from "./dataBase.ts";
import fetch from "node-fetch";
 const limitCalls = 30;
 let   nextCalls = 0;
async function NextCall() {
  if(nextCalls >= limitCalls){
     console.log("Please wait a moment......");
     setTimeout(NextCall, 5000);
    return;
   }
  const query =  `SELECT * FROM public."Call"
  WHERE id = (
  SELECT id FROM public."Call"
  WHERE status='PENDING'
  ORDER BY created
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)`;

  const {rows} = await pool.query(query);
  const call =rows[0];

  if (!call) {
    console.log("Error Not found  Call in PENDING status");
    setTimeout(NextCall, 5000);
    return;
  }
  
  if(call.attempts < 3){
  nextCalls ++;
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const response = await fetch("https://provider.com/api/v1/calls", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        to:call.payload.to,
        scriptId: call.payload.scriptId,
        webhookUrl: "https://our-service.com/callbacks/call-status",
      }),
    });
  
    if (response.status === 200) {
       const query= `UPDATE public."Call" SET status='IN_PROGRESS', started=NOW() WHERE id=$1;`
       await pool.query( query,[call.id]);
      console.log(call.id);
    } 

    

  } catch (error) {
    const query=`UPDATE public."Call" SET attempts=attempts+1 , lastError=$1  WHERE id=$2`;
   await pool.query(query,[error,call.id]);
    NextCall();
  }
    nextCalls --;
     NextCall();
  
}
else {
    const query= `UPDATE public."Call" SET status = 'FAILED', lastError = 'Maximum number of attempts reached' WHERE id = $1`;
    await pool.query( query,[call.id]);
    
}
}

for (let i = 0; i < limitCalls; i++) {
  NextCall();
}

