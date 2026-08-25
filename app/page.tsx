"use client";
import {ChangeEvent,FormEvent,useMemo,useState} from "react";

const cats=[
  ["Electronics","Phones, games & tech","⌁"],
  ["Clothing","Fashion & accessories","♢"],
  ["Home & Furniture","Furniture & décor","⌂"],
  ["Collectibles","Cards, art & vintage","✦"],
  ["Sporting Goods","Fitness & outdoors","◒"]
];
const items=[
  {title:"iPhone 15 Pro · 256GB",price:"$675",place:"Fresno · 2 mi",cat:"Electronics",image:"https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80"},
  {title:"Mid-century lounge chair",price:"$240",place:"Clovis · 5 mi",cat:"Home & Furniture",image:"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80"},
  {title:"Retro low-top sneakers",price:"$55",place:"Madera · 18 mi",cat:"Clothing",image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"}
];

export default function Home(){
 const [post,setPost]=useState(false),[profile,setProfile]=useState(false),[query,setQuery]=useState(""),[filter,setFilter]=useState("All"),[photos,setPhotos]=useState<string[]>([]),[toast,setToast]=useState("");
 const visible=useMemo(()=>items.filter(x=>(filter==="All"||x.cat===filter)&&x.title.toLowerCase().includes(query.toLowerCase())),[query,filter]);
 const upload=(e:ChangeEvent<HTMLInputElement>)=>setPhotos(p=>[...p,...Array.from(e.target.files||[]).map(URL.createObjectURL)].slice(0,4));
 const done=(message:string)=>{setPost(false);setProfile(false);setPhotos([]);setToast(message);setTimeout(()=>setToast(""),3500)};
 return <main>
  <header><a className="brand" href="#"><i>A</i><b>AdLoca<small>LOCAL ADS. REAL LOCATIONS.</small></b></a><nav><a href="#browse">Browse</a><a href="#safe">How it works</a><a href="https://www.polepost.org">PolePost</a></nav><div><button className="plain" onClick={()=>setProfile(true)}>Sign in</button><button className="button" onClick={()=>setPost(true)}>＋ Post an item</button></div></header>
  <section className="hero"><span className="kicker">● BUY & SELL CLOSER TO HOME</span><h1>Find it <em>near you.</em><br/>Sell it with confidence.</h1><p>Local listings organized by real locations. Meet nearby and use AdLoca Tokens for extra transaction protection.</p><div className="search"><label>⌕ <input aria-label="Search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="What are you looking for?"/></label><label>⌖ <input aria-label="Location" defaultValue="Fresno County, CA"/></label><a className="button" href="#browse">Search</a></div><div className="popular">Popular: {['iPhone','Furniture','Sneakers','Collectibles'].map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div></section>
  <section className="wrap"><div className="heading"><div><span className="kicker">START LOCAL</span><h2>What are you looking for?</h2></div><button className="plain" onClick={()=>setFilter("All")}>View all categories →</button></div><div className="categories">{cats.map(c=><button className={filter===c[0]?"category active":"category"} onClick={()=>setFilter(c[0])} key={c[0]}><i>{c[2]}</i><b>{c[0]}</b><small>{c[1]}</small><span>→</span></button>)}</div></section>
  <section className="wrap listings" id="browse"><div className="heading"><div><span className="kicker">NEAR FRESNO COUNTY</span><h2>Fresh local finds</h2></div><small>{visible.length} listings shown</small></div><div className="cards">{visible.map(x=><article key={x.title}><div className="pic"><img src={x.image} alt=""/><span>Verified location</span><button>♡</button></div><div className="copy"><small>{x.cat}</small><h3>{x.title}</h3><b>{x.price}</b><p>⌖ {x.place}</p></div></article>)}</div>{!visible.length&&<div className="empty">No matches yet. Try another search or category.</div>}</section>
  <section className="safe" id="safe"><div><span className="kicker">A SAFER WAY TO TRADE</span><h2>No cash between strangers.</h2><p>Reserve AdLoca Tokens, confirm the exchange with a secure QR code, and release them when both sides are satisfied.</p></div><ol>{[["1","Agree","Make or accept an offer"],["2","Reserve","Tokens are held securely"],["3","Confirm","Scan to complete the sale"]].map(x=><li key={x[0]}><b>{x[0]}</b><span><strong>{x[1]}</strong><small>{x[2]}</small></span></li>)}</ol></section>
  <section className="pole"><i>P</i><div><small>POWERED BY LOCAL COMMUNITY</small><h2>Selling something? Post it where neighbors look.</h2><p>PolePost gets the word out. AdLoca gets it sold.</p></div><a href="https://www.polepost.org">Visit PolePost ↗</a></section>
  <footer><span>AdLoca</span><p>Local ads. Real locations. Safer exchanges.</p><small>© 2026 AdLoca</small></footer>
  {toast&&<div className="toast">✓ {toast}</div>}
  {post&&<Modal close={()=>setPost(false)}><span className="kicker">NEW LOCAL LISTING</span><h2>Post an item</h2><p>Add the essentials and up to four photos.</p><form onSubmit={(e:FormEvent)=>{e.preventDefault();done("Your listing is ready for review.")}}><label>Item title<input required placeholder="What are you selling?"/></label><div className="twocol"><label>Category<select required defaultValue=""><option value="" disabled>Choose one</option>{cats.map(c=><option key={c[0]}>{c[0]}</option>)}</select></label><label>Price<input required type="number" min="1" placeholder="$ 0"/></label></div><label>Description<textarea required rows={3} placeholder="Condition, details, pickup options…"/></label><label>ZIP code or county<input required placeholder="93721 or Fresno County"/></label><fieldset><legend>Photos <span>{photos.length}/4</span></legend><div className="uploads">{photos.map((src,i)=><div className="preview" key={src}><img src={src} alt="Uploaded item"/><button type="button" onClick={()=>setPhotos(photos.filter((_,n)=>n!==i))}>×</button></div>)}{photos.length<4&&<label className="upload">＋<small>Add photo</small><input type="file" accept="image/*" multiple onChange={upload}/></label>}</div></fieldset><button className="button full">Continue to review</button></form></Modal>}
  {profile&&<Modal close={()=>setProfile(false)}><div className="profile"><i className="bigpin">A</i><h2>Create your AdLoca profile</h2><p>One profile for buying, selling, saved locations and Tokens.</p></div><form onSubmit={(e:FormEvent)=>{e.preventDefault();done("Profile created. Welcome to AdLoca!")}}><label>Display name<input required placeholder="Your name"/></label><label>Email address<input required type="email" placeholder="you@example.com"/></label><label>Home ZIP code<input required placeholder="93721"/></label><button className="button full">Create free profile</button></form></Modal>}
 </main>
}
function Modal({children,close}:{children:React.ReactNode,close:()=>void}){return <div className="backdrop" onMouseDown={close}><section className="modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button>{children}</section></div>}
