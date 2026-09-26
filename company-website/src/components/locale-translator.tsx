"use client";
import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";
import { uiPhrases } from "@/locales/ui-phrases";

export function LocaleTranslator({locale}:{locale:Locale}){
  useEffect(()=>{
    if(locale==="en")return;
    const phrases=uiPhrases[locale];
    const translateNode=(node:Node)=>{
      if(node.nodeType===Node.TEXT_NODE){
        const raw=node.textContent||"";const trimmed=raw.trim();
        if(!trimmed)return;
        const canonical=Object.keys(phrases).find(key=>key===trimmed||uiPhrases.ar[key]===trimmed||uiPhrases.he[key]===trimmed);
        const exact=canonical?phrases[canonical]:undefined;
        if(exact)node.textContent=raw.replace(trimmed,exact);
        else if(trimmed.startsWith("Launch "))node.textContent=raw.replace(trimmed,`${phrases["Launch demo"]} — ${trimmed.slice(7)}`);
      }
      if(node instanceof HTMLElement){
        for(const attr of ["aria-label","placeholder","title"]){const value=node.getAttribute(attr);if(value&&phrases[value])node.setAttribute(attr,phrases[value]);}
      }
      node.childNodes.forEach(translateNode);
    };
    translateNode(document.body);
    const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(translateNode)));
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[locale]);
  return null;
}
