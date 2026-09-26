import { esc } from "./design.js";
import { moneyRange, formatWait, pretty } from "./club.js";

export function statusLabel(status) {
  return status === "inquiry_only" ? "Contact club" : pretty(status || "Unknown");
}

export function clubCard(row,{showCompare=true}={}) {
  const c=row;
  const location=[c.city,c.stateCode].filter(Boolean).join(", ");
  const dues=moneyRange(c.duesMin,c.duesMax);
  const wait=formatWait(c.waitEstimateMinMonths,c.waitEstimateMaxMonths);
  const summary=c.membershipSummary||c.description||"Membership and access details from sourced club records.";
  const img=c.coverImageUrl ? '<img class="club-photo" loading="lazy" src="'+esc(c.coverImageUrl)+'" alt="">' : "";
  const compare=showCompare ? '<button type="button" class="btn secondary small compare-toggle" data-id="'+esc(c.id)+'" data-slug="'+esc(c.canonicalSlug)+'" data-name="'+esc(c.name)+'">Compare</button>' : "";
  return '<article class="card">'+
    '<a class="card-link" href="/clubs/'+encodeURIComponent(c.canonicalSlug)+'" aria-label="View '+esc(c.name)+'"></a>'+
    '<div class="card-content">'+img+
      '<div class="eyebrow">'+esc(c.clubType==="swim_pool"?"Swim & pool":pretty(c.clubType||"Club"))+'</div>'+
      '<h3>'+esc(c.name)+'</h3>'+
      '<div class="kicker">'+esc(location||"United States")+'</div>'+
      '<p>'+esc(summary.length>190?summary.slice(0,187)+"…":summary)+'</p>'+
      '<div><span class="pill">'+esc(statusLabel(c.membershipStatus))+'</span><span class="pill">'+esc(dues)+'</span>'+(wait?'<span class="pill">'+esc(wait)+' wait</span>':"")+'</div>'+
    '</div>'+
    '<div class="card-actions">'+compare+'<a class="btn ghost small" href="/clubs/'+encodeURIComponent(c.canonicalSlug)+'">View details →</a></div>'+
  '</article>';
}

export function findMyClubPanel(total) {
  return '<section class="section" id="find-my-club"><div class="wrap">'+
    '<div class="match-shell">'+
      '<div class="eyebrow">Find my club</div>'+
      '<h2>What are you looking for in a club?</h2>'+
      '<p class="muted">Describe it naturally. ClubTaps matches your priorities against '+Number(total).toLocaleString("en-US")+' sourced club records.</p>'+
      '<div class="prompt-box"><textarea id="matchQuery" aria-label="Describe the private club you want" placeholder="Example: I live near Timonium. I want a family club with a pool and tennis, under $4,000/year, ideally no more than a one-year wait. Golf doesn’t matter."></textarea>'+
      '<div class="prompt-actions"><span class="kicker">Use plain English — budget, location, amenities, wait time, membership type…</span><button type="button" class="btn" id="matchSubmit">Find my club</button></div></div>'+
      '<div class="examples"><span class="kicker">Try:</span>'+
        '<button type="button" class="btn secondary small match-example">Family club near Baltimore with a pool and tennis, under $2,500 a year</button>'+
        '<button type="button" class="btn secondary small match-example">Private club near Dallas with a social membership. Golf does not matter.</button>'+
        '<button type="button" class="btn secondary small match-example">Swim club around Boston with the shortest possible wait</button>'+
      '</div>'+
      '<div id="matchStatus" class="form-status" style="margin-top:12px"></div><div id="matchResults" class="match-results"></div>'+
    '</div></div></section>';
}

function clientRuntime() {
  const escapeHtml = function(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});
  };
  const pretty = function(v){return String(v||"").replace(/_/g," ").replace(/\b\w/g,function(m){return m.toUpperCase()})};
  const money = function(min,max){
    if(min==null&&max==null)return "Not publicly listed";
    const f=function(v){return "$"+Number(v).toLocaleString(undefined,{maximumFractionDigits:0})};
    return min!=null&&max!=null&&Number(min)!==Number(max)?f(min)+"–"+f(max):f(min!=null?min:max);
  };
  const wait = function(x){
    if(!x||(!x.min&&!x.max))return "Not documented";
    if(x.min!=null&&x.max!=null&&Number(x.min)!==Number(x.max))return x.min+"–"+x.max+" months";
    const n=Number(x.min!=null?x.min:x.max);return n+" "+(n===1?"month":"months");
  };

  let selected=[];
  try{selected=JSON.parse(sessionStorage.getItem("clubtaps_compare")||"[]")}catch(e){selected=[]}
  const save=function(){sessionStorage.setItem("clubtaps_compare",JSON.stringify(selected.slice(0,4)));renderDock();syncButtons()};
  const syncButtons=function(){
    document.querySelectorAll(".compare-toggle").forEach(function(btn){
      const on=selected.some(function(x){return x.id===btn.dataset.id});
      btn.textContent=on?"Selected":"Compare";btn.classList.toggle("secondary",!on);
    });
  };
  const renderDock=function(){
    const dock=document.getElementById("compareDock");if(!dock)return;
    if(!selected.length){dock.classList.remove("show");dock.innerHTML="";return}
    dock.classList.add("show");
    dock.innerHTML='<div class="compare-inner"><div class="compare-summary"><strong>'+selected.length+' selected</strong><br><span class="muted">'+(selected.length<2?"Select one more club":"Compare side by side")+'</span></div><div class="compare-chips">'+selected.map(function(x){return '<span class="compare-chip">'+escapeHtml(x.name)+'</span>'}).join("")+'</div><button type="button" class="btn ghost small" id="compareClear">Clear</button><button type="button" class="btn small" id="compareOpen" '+(selected.length<2?"disabled":"")+'>Compare '+(selected.length>1?selected.length:"")+'</button></div>';
    const clear=document.getElementById("compareClear");if(clear)clear.onclick=function(){selected=[];save()};
    const open=document.getElementById("compareOpen");if(open)open.onclick=openCompare;
  };
  const toggleCompare=function(btn){
    const item={id:btn.dataset.id,slug:btn.dataset.slug,name:btn.dataset.name};
    const i=selected.findIndex(function(x){return x.id===item.id});
    if(i>=0)selected.splice(i,1);else if(selected.length<4)selected.push(item);
    save();
  };
  document.addEventListener("click",function(e){
    const btn=e.target.closest(".compare-toggle");if(btn){e.preventDefault();e.stopPropagation();toggleCompare(btn)}
  });

  async function openCompare(){
    if(selected.length<2)return;
    const modal=document.getElementById("compareModal");modal.classList.add("open");modal.innerHTML='<div class="modal"><button class="modal-close" aria-label="Close">×</button><h2>Compare private clubs</h2><p class="muted">Side-by-side facts from ClubTaps sourced records.</p><div class="notice">Loading comparison…</div></div>';
    modal.querySelector(".modal-close").onclick=function(){modal.classList.remove("open")};
    try{
      const clubs=await Promise.all(selected.map(function(x){return fetch("/_api/public/clubs/get?slug="+encodeURIComponent(x.slug)).then(function(r){if(!r.ok)throw new Error("load");return r.json()})}));
      const rows=[
        ["Membership status",function(c){return c.membership.status==="inquiry_only"?"Contact club":pretty(c.membership.status)}],
        ["Dues",function(c){return money(c.pricing.dues.min,c.pricing.dues.max)}],
        ["Initiation fee",function(c){return money(c.pricing.initiationFee.min,c.pricing.initiationFee.max)}],
        ["Estimated wait",function(c){return wait(c.membership.waitMonths)}],
        ["Membership types",function(c){return (c.membership.types||[]).slice(0,5).join(" · ")||"Not documented"}],
        ["Sponsor required",function(c){return c.membership.sponsorRequired==null?"Not documented":c.membership.sponsorRequired?"Yes":"No"}],
        ["Residency restricted",function(c){return c.membership.residencyRestricted==null?"Not documented":c.membership.residencyRestricted?"Yes":"No"}],
        ["Guest access",function(c){return c.access.guestAccess===true?"Yes":c.access.guestAccess===false?"No":"Not documented"}],
        ["Lap swim",function(c){return c.pool.lapSwim===true?"Yes":"Not documented"}]
      ];
      let html='<div class="modal"><button class="modal-close" aria-label="Close">×</button><h2>Compare private clubs</h2><p class="muted">Side-by-side membership facts from ClubTaps sourced records.</p><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Compare</th>';
      clubs.forEach(function(c){html+='<th><a href="'+escapeHtml(c.canonicalUrl)+'">'+escapeHtml(c.name)+'</a><div class="kicker">'+escapeHtml([c.location.city,c.location.state].filter(Boolean).join(", "))+'</div></th>'});
      html+='</tr></thead><tbody>';
      rows.forEach(function(row){html+='<tr><th>'+escapeHtml(row[0])+'</th>';clubs.forEach(function(c){html+='<td>'+escapeHtml(row[1](c))+'</td>'});html+='</tr>'});
      html+='</tbody></table></div></div>';modal.innerHTML=html;modal.querySelector(".modal-close").onclick=function(){modal.classList.remove("open")};
    }catch(e){modal.querySelector(".modal").insertAdjacentHTML("beforeend",'<div class="notice error">Could not load this comparison. Please try again.</div>')}
  }

  document.querySelectorAll(".modal-backdrop").forEach(function(m){m.addEventListener("click",function(e){if(e.target===m)m.classList.remove("open")})});

  function inquiryForm(title,clubIds,searchQuery){
    const modal=document.getElementById("inquiryModal");modal.classList.add("open");
    modal.innerHTML='<div class="modal narrow"><button class="modal-close" aria-label="Close">×</button><div class="eyebrow">ClubTaps request</div><h2>'+escapeHtml(title)+'</h2><p class="muted">We save this as an availability or membership-information request. This is not a club application and does not guarantee availability.</p><form id="inquiryForm" class="form-grid"><label>Name<input name="name" type="text" maxlength="120" required></label><label>Email<input name="email" type="email" maxlength="240" required></label><label>Phone <span class="muted">optional</span><input name="phone" type="tel" maxlength="60"></label><label>Anything else? <span class="muted">optional</span><textarea name="message" rows="3" maxlength="3000"></textarea></label><input name="website" type="text" tabindex="-1" autocomplete="off" style="display:none"><div id="inquiryStatus" class="form-status"></div><button class="btn" type="submit">Request availability check</button></form></div>';
    modal.querySelector(".modal-close").onclick=function(){modal.classList.remove("open")};
    modal.querySelector("form").onsubmit=async function(e){
      e.preventDefault();const f=new FormData(e.currentTarget);const status=document.getElementById("inquiryStatus");status.textContent="Saving…";
      const body={name:f.get("name"),email:f.get("email"),phone:f.get("phone"),message:f.get("message"),website:f.get("website")};
      let endpoint="/_api/membership-inquiries/create";
      if(clubIds.length>1){endpoint="/_api/membership-inquiries/bulk";body.clubIds=clubIds;body.searchQuery=searchQuery||""}
      else{body.clubId=Number(clubIds[0]);body.membershipType="Membership information"}
      try{const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error("save");status.textContent="Saved. ClubTaps has recorded your request.";e.currentTarget.querySelector("button[type=submit]").disabled=true}catch(err){status.textContent="We could not save this request. Please try again."}
    };
  }
  document.addEventListener("click",function(e){
    const btn=e.target.closest("[data-inquiry-club]");if(btn){e.preventDefault();inquiryForm("Interested in "+btn.dataset.clubName+"?",[btn.dataset.inquiryClub],"")}
  });

  const matchInput=document.getElementById("matchQuery"),matchSubmit=document.getElementById("matchSubmit");
  document.querySelectorAll(".match-example").forEach(function(btn){btn.onclick=function(){if(matchInput){matchInput.value=btn.textContent;matchInput.focus()}}});
  if(matchSubmit&&matchInput){
    matchSubmit.onclick=async function(){
      const query=matchInput.value.trim();if(query.length<8)return;
      const status=document.getElementById("matchStatus"),results=document.getElementById("matchResults");status.textContent="Finding matches…";results.innerHTML="";matchSubmit.disabled=true;
      try{
        const r=await fetch("/_api/clubs/match",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:query})});if(!r.ok)throw new Error("match");
        const data=await r.json();status.innerHTML='<strong>Matched for:</strong> '+escapeHtml(data.preferences.summary);
        results.innerHTML='<div class="match-grid">'+data.matches.map(function(m){
          const c=m.club;return '<article class="match-card"><div class="eyebrow">'+escapeHtml(m.label)+'</div><div class="match-score">'+escapeHtml(m.score)+'%</div><h3><a href="/clubs/'+encodeURIComponent(c.canonicalSlug)+'">'+escapeHtml(c.name)+'</a></h3><div class="kicker">'+escapeHtml([c.city,c.stateCode].filter(Boolean).join(", "))+'</div><p class="match-why">'+escapeHtml(m.why)+'</p><div><span class="pill">'+escapeHtml(money(c.duesMin,c.duesMax))+'</span><span class="pill">'+escapeHtml(c.membershipStatus==="inquiry_only"?"Contact club":pretty(c.membershipStatus))+'</span></div><div class="card-actions"><button type="button" class="btn secondary small compare-toggle" data-id="'+escapeHtml(c.id)+'" data-slug="'+escapeHtml(c.canonicalSlug)+'" data-name="'+escapeHtml(c.name)+'">Compare</button><a class="btn ghost small" href="/clubs/'+encodeURIComponent(c.canonicalSlug)+'">View club →</a></div></article>'
        }).join("")+'</div><div class="hero-actions"><button type="button" class="btn" id="availabilityBtn">Check availability for these clubs</button></div>';
        const av=document.getElementById("availabilityBtn");if(av)av.onclick=function(){inquiryForm("Check availability for your shortlist",data.matches.map(function(m){return m.club.id}),query)};
        syncButtons();
      }catch(err){status.textContent="We could not create a shortlist. Try rephrasing your search."}finally{matchSubmit.disabled=false}
    };
  }

  renderDock();syncButtons();
}

export function clientScript() {
  return "(" + clientRuntime.toString() + ")();";
}
