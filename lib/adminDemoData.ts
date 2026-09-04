export type AdminUser = { id:string; name:string; email:string; programme:string; role:"Student"|"Admin"; status:"Active"|"Suspended"; joined:string };
export type AdminResource = { id:string; title:string; category:string; type:"Guide"|"Article"|"Template"|"Video"; status:"Published"|"Draft"; updated:string };
export type AdminOpportunity = { id:string; organisation:string; role:string; location:string; closingDate:string; status:"Published"|"Draft"|"Closed"; applications:number };

export const adminUsers: AdminUser[] = [
  { id:"USR-1048", name:"Mia Thompson", email:"mia.thompson@example.test", programme:"Information Sciences", role:"Student", status:"Active", joined:"2 Sep 2026" },
  { id:"USR-1047", name:"Noah Williams", email:"noah.williams@example.test", programme:"Business", role:"Student", status:"Active", joined:"1 Sep 2026" },
  { id:"USR-1046", name:"Ava Patel", email:"ava.patel@example.test", programme:"Engineering", role:"Student", status:"Suspended", joined:"29 Aug 2026" },
  { id:"USR-1045", name:"Yanzhen Cheng", email:"admin@example.test", programme:"Administration", role:"Admin", status:"Active", joined:"25 Aug 2026" },
  { id:"USR-1044", name:"Jack Wilson", email:"jack.wilson@example.test", programme:"Design", role:"Student", status:"Active", joined:"23 Aug 2026" },
];
export const adminResources: AdminResource[] = [
  { id:"RES-204", title:"Technical interview preparation", category:"Interviews", type:"Guide", status:"Published", updated:"4 Sep 2026" },
  { id:"RES-203", title:"Graduate CV template", category:"CV & Cover Letters", type:"Template", status:"Published", updated:"2 Sep 2026" },
  { id:"RES-202", title:"Building a career action plan", category:"Career Planning", type:"Video", status:"Draft", updated:"30 Aug 2026" },
  { id:"RES-201", title:"Cover letter checklist", category:"CV & Cover Letters", type:"Guide", status:"Published", updated:"26 Aug 2026" },
];
export const adminOpportunities: AdminOpportunity[] = [
  { id:"OPP-312", organisation:"Xero", role:"Software Engineering Intern", location:"Auckland", closingDate:"18 Sep 2026", status:"Published", applications:24 },
  { id:"OPP-311", organisation:"Fonterra", role:"Data Analytics Intern", location:"Hamilton", closingDate:"22 Sep 2026", status:"Published", applications:17 },
  { id:"OPP-310", organisation:"Wellington City Council", role:"Digital Experience Intern", location:"Wellington", closingDate:"28 Sep 2026", status:"Draft", applications:0 },
  { id:"OPP-309", organisation:"Datacom", role:"Graduate Cloud Consultant", location:"Auckland", closingDate:"31 Aug 2026", status:"Closed", applications:31 },
];
