"use client";
import { useEffect, useState } from "react";

export function useAdminDemoData<T>(key:string, seed:T[]) {
  const [rows,setRows]=useState<T[]>(seed);
  const [ready,setReady]=useState(false);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=localStorage.getItem(key);if(saved)setRows(JSON.parse(saved))}catch{}finally{setReady(true)}},0);return()=>window.clearTimeout(timer)},[key]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(key,JSON.stringify(rows))}catch{}},[key,ready,rows]);
  return [rows,setRows] as const;
}
