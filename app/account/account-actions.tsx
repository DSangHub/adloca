"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountActions({hasBilling}:{hasBilling:boolean}) {
  const [error,setError]=useState("");
  const go=async(path:string)=>{setError("");const response=await fetch(path,{method:"POST"}),body=await response.json();if(!response.ok){setError(body.error||"Request failed");return}location.href=body.url};
  return <><div className="accountactions"><button className="button" onClick={()=>go("/api/stripe/checkout")}>Upgrade advertising</button>{hasBilling&&<button className="plain bordered" onClick={()=>go("/api/stripe/portal")}>Manage billing</button>}<button className="plain bordered" onClick={async()=>{await createClient().auth.signOut();location.href="/"}}>Sign out</button></div>{error&&<p className="formerror">{error}</p>}</>;
}
