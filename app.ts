 import express from "express"
 import { pool }  from "./dataBase.ts";

const app=express();
app.use(express.json())

//Creating Call
app.post("/calls", async (req, res) => {
     const { to, scriptId, metadata } = req.body;
     const payload = { to, scriptId, metadata };

    if (to==null || scriptId==null) {
     return res.status(404).json({ error: "to and scriptId must have value" });}

 try {
    const query = `INSERT INTO public."Call" (payload, status, attempts) VALUES ($1, 'PENDING', 0) RETURNING *;`;
    const {rows} = await pool.query(query, [payload]);
     if (!rows.length) { return res.status(404).json({ error: "Error Not Creating Call" })}
    res.status(200).json(rows[0]);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error"});
  }
});


//Getting call by ID
app.get("/calls/:id",  async (req, res) =>{
    const id =req.params.id;

  try {
    const query = `SELECT * FROM public."Call" WHERE id = $1;`;
    const {rows} = await pool.query(query, [id]);
    if (!rows.length) { return res.status(404).json({ error: "Error Not Found Call" })}
    res.status(200).json(rows[0]);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update payload 
app.patch("/calls/:id", async(req ,res)=>{
 const id =req.params.id;
 const { to, scriptId, metadata } = req.body;
 const payload = { to, scriptId, metadata };
 try{

    const query = `UPDATE public."Call" SET payload = $1 WHERE id = $2 AND status = 'PENDING' RETURNING *;`;
    const {rows} = await pool.query(query, [payload, id]);
    if (!rows.length) { return res.status(404).json({  error: "Error Not found  Call in PENDING status " });}
    res.status(200).json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//List by Status
app.get("/calls", async(req,res)=>{
  const {status,limit = 10} = req.query;
  const offset=1;
    try{
  const query = `SELECT * FROM public."Call" WHERE status=$1 ORDER BY created DESC LIMIT $2 OFFSET $3`;
  const {rows} = await pool.query(query,[status, limit, offset]);
  res.status(200).json(rows);
    }catch{
 res.status(500).json({ error: "Internal Server Error" });
    }
});

//Metrics Endpoint
app.get("/metrics",async(req,res)=>{
    try{
     const query=`SELECT status, COUNT(*) FROM public."Call" GROUP BY status;`
     const {rows}=await pool.query(query)
     res.status(200).json(rows)
    }catch{
    res.status(500).json({ error: "Internal Server Error" });
    }

});


app.post("/callbacks/call-status", async (req, res) => {
 try {
    const {callId, status, durationSec, completedAt } = req.body;
    const query = `UPDATE public."Call" SET status = $1, ended = $2 WHERE id=$3 RETURNING *;`;
    const {rows} = await pool.query(query, [status,completedAt,callId]);
    if (!rows.length) { return res.status(404).json({ error: "Call not found" }); }
    res.status(200).json({rows});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating call status" });
  }
});


app.listen(3000,()=> console.log('noora'))