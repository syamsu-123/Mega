import{y as G,B as z,C as Q,D as R,E as X}from"./firebase-service-CVGET8i4.js";let I=null,g=null,k=[],D="All",N="",P=localStorage.getItem("userRole")||"Viewer",x=1;const O=20;function Y(){const a=document.createElement("style");a.innerHTML=`
        .goog-te-banner-frame.skiptranslate, .skiptranslate > iframe { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
    `,document.head.appendChild(a),window.googleTranslateElementInit=function(){new google.translate.TranslateElement({pageLanguage:"id",includedLanguages:"en,id",autoDisplay:!1},"google_translate_element")};const t=document.createElement("script");t.type="text/javascript",t.src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",document.body.appendChild(t);const e=document.createElement("div");e.id="google_translate_element",document.body.appendChild(e);let n=(l=>{const i=document.cookie.match(new RegExp("(^| )"+l+"=([^;]+)"));return i?i[2]:null})("googtrans")==="/id/en"?"EN":"ID";const s=l=>{l&&l.preventDefault();const i=n==="ID"?"/id/en":"/id/id";document.cookie=`googtrans=${i}; path=/`,document.cookie=`googtrans=${i}; domain=.${location.hostname}; path=/`,window.location.reload()},r=document.getElementById("themeToggle");if(r&&!document.getElementById("langToggleBtn")){const l=document.createElement("button");l.id="langToggleBtn",l.className="flex items-center justify-center gap-1.5 w-10 h-10 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",l.innerHTML='<i class="fas fa-globe text-lg"></i>',l.title=n==="ID"?"Switch to English":"Ganti ke Bahasa Indonesia",l.addEventListener("click",s),r.parentNode.insertBefore(l,r)}}Y();document.addEventListener("DOMContentLoaded",async()=>{const a=document.getElementById("themeToggle");if(localStorage.getItem("theme")==="dark"||!localStorage.getItem("theme")&&window.matchMedia("(prefers-color-scheme: dark)").matches?(document.documentElement.classList.add("dark"),a&&(a.innerHTML='<i class="fas fa-sun text-lg"></i>')):(document.documentElement.classList.remove("dark"),a&&(a.innerHTML='<i class="fas fa-moon text-lg"></i>')),a&&a.addEventListener("click",()=>{document.documentElement.classList.toggle("dark");const e=document.documentElement.classList.contains("dark");localStorage.setItem("theme",e?"dark":"light"),a.innerHTML=e?'<i class="fas fa-sun text-lg"></i>':'<i class="fas fa-moon text-lg"></i>'}),I=new URLSearchParams(window.location.search).get("id"),!I){window.location.href="dashboard.html";return}if(g=await G(I),!g){const e=document.documentElement.classList.contains("dark");Swal.fire({icon:"error",title:"Proyek Tidak Ditemukan",text:"Mengarahkan kembali ke dashboard...",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}).then(()=>window.location.href="dashboard.html");return}if(P==="Viewer"){const e=localStorage.getItem("projectCode")||localStorage.getItem("userName")||"",o=document.documentElement.classList.contains("dark"),n=String(e).split("@")[0].replace(/\s+/g,"").toUpperCase();if((g.code?String(g.code).replace(/\s+/g,"").toUpperCase():"")!==n){Swal.fire({icon:"error",title:"Akses Ditolak",text:"Anda tidak memiliki izin melihat logistik proyek ini.",background:o?"#1A1A1A":"#ffffff",color:o?"#ffffff":"#1e293b"}).then(()=>window.location.href="dashboard.html");return}}document.title=`Monitoring Material - ${g.name}`,document.getElementById("header-project-name").innerText=g.code?`[${g.code}] ${g.name}`:g.name,P!=="Viewer"&&(document.getElementById("admin-actions").style.display="flex"),await E(),document.getElementById("loading-indicator").classList.add("hidden"),document.getElementById("main-content").classList.remove("hidden")});async function E(){k=await z(I),q(),T()}function q(){const a=document.getElementById("material-stats"),t={};k.forEach(s=>{const r=s.itemCode&&s.itemCode.trim()!==""?s.itemCode.trim().toUpperCase():s.id;t[r]||(t[r]={mto:s.mto||0,qtyPo:0}),t[r].qtyPo+=s.target||0,t[r].mto=Math.max(t[r].mto,s.mto||0)});let e=Object.keys(t).length,o=0,n=0;Object.values(t).forEach(s=>{s.qtyPo>=s.mto?n++:o++}),a.innerHTML=`
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Jenis Material</p>
                    <h3 class="text-3xl font-bold text-slate-800 dark:text-white">${e}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><i class="fas fa-boxes"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Sudah Terpenuhi</p>
                    <h3 class="text-3xl font-bold text-[#22C55E]">${n}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-check-circle"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Belum Terpenuhi</p>
                    <h3 class="text-3xl font-bold text-[#EF4444]">${o}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-[#EF4444]"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
        </div>
    `}function M(){let a=[...k];if(D!=="All"&&(a=a.filter(t=>(t.poStatus||"Belum PO")===D)),N.trim()!==""){const t=N.toLowerCase();a=a.filter(e=>e.name&&String(e.name).toLowerCase().includes(t)||e.itemCode&&String(e.itemCode).toLowerCase().includes(t)||e.poNumber&&String(e.poNumber).toLowerCase().includes(t))}return a.sort((t,e)=>{const o=(t.itemCode||"").toLowerCase(),n=(e.itemCode||"").toLowerCase();if(o<n)return-1;if(o>n)return 1;const s=(t.name||"").toLowerCase(),r=(e.name||"").toLowerCase();return s.localeCompare(r)}),a}function T(){const a=document.getElementById("materials-table");let t=M();const e=Math.ceil(t.length/O);x>e&&e>0&&(x=e);const o=(x-1)*O,n=Math.min(o+O,t.length),s=t.slice(o,n),r=document.getElementById("pagination-controls"),l=document.getElementById("pagination-info"),i=document.getElementById("btn-prev-page"),f=document.getElementById("btn-next-page");if(t.length===0){r&&r.classList.add("hidden"),a.innerHTML='<tr><td colspan="100%" class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic">Tidak ada data material yang sesuai.</td></tr>';return}t.length>O?(r&&r.classList.remove("hidden"),l&&(l.innerText=`Menampilkan ${o+1} - ${n} dari ${t.length} data`),i&&(i.disabled=x===1),f&&(f.disabled=x===e)):r&&r.classList.add("hidden");const b={};k.forEach(c=>{if(c.itemCode&&c.itemCode.trim()!==""){const u=c.itemCode.trim().toUpperCase();b[u]=(b[u]||0)+(c.target||0)}});let A=`
        <thead>
            <tr class="text-xs uppercase text-slate-500 dark:text-[#A1A1AA] border-b border-slate-200 dark:border-[#2A2A2A]">
                ${P!=="Viewer"?'<th class="p-4 font-semibold text-center w-10"><input type="checkbox" id="check-all-materials" onchange="toggleAllMaterialChecks(this)" class="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer"></th>':""}
                <th class="p-4 font-semibold text-center w-12">No</th>
                <th class="p-4 font-semibold">Kode Item</th>
                <th class="p-4 font-semibold w-1/5">Item Material</th>
                <th class="p-4 font-semibold text-right w-24 whitespace-nowrap">MTO</th>
                <th class="p-4 font-semibold text-right w-32 whitespace-nowrap">Quantity PO</th>
                <th class="p-4 font-semibold text-center">Satuan</th>
                <th class="p-4 font-semibold text-center">Status Material</th>
                <th class="p-4 font-semibold text-center">Status PO</th>
                <th class="p-4 font-semibold">No PO</th>
                <th class="p-4 font-semibold">Lead Time / Remarks</th>
                <th class="p-4 font-semibold">Keterangan</th>
                ${P!=="Viewer"?`<th class="p-4 font-semibold text-center">
                    <span id="aksi-title">Aksi</span>
                    <div id="bulk-actions" class="hidden items-center justify-center gap-2">
                        <button id="btn-edit-selected" onclick="editSelectedMaterials()" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition-colors whitespace-nowrap shadow-sm"><i class="fas fa-edit mr-1"></i>Edit (<span id="count-selected-edit">0</span>)</button>
                        <button id="btn-delete-selected" onclick="deleteSelectedMaterials()" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors whitespace-nowrap shadow-sm"><i class="fas fa-trash mr-1"></i>Hapus (<span id="count-selected-delete">0</span>)</button>
                    </div>
                </th>`:""}
            </tr>
        </thead>
        <tbody>
    `,y=s.map((c,u)=>{let w=o+u+1;const v=c.mto||0,d=c.target||0;let m=d;if(c.itemCode&&c.itemCode.trim()!==""){const S=c.itemCode.trim().toUpperCase();b[S]&&(m=b[S])}let p='<span class="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Belum Terpenuhi</span>';m>v?p='<span class="bg-red-100 dark:bg-[#EF4444]/10 text-[#EF4444] border border-red-200 dark:border-[#EF4444]/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Over Quantity</span>':m===v&&v>0&&(p='<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Sudah Terpenuhi</span>');let h='<span class="bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">Belum PO</span>';return c.poStatus==="Sudah PO dan Payment"?h='<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO & Paid</span>':c.poStatus==="Sudah PO belum Payment"&&(h='<span class="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO Unpaid</span>'),`
            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#121212] transition-colors">
                ${P!=="Viewer"?`<td class="p-4 text-center"><input type="checkbox" class="material-checkbox w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer" value="${c.id}" onchange="updateSelectedCount()"></td>`:""}
                <td class="p-4 text-sm text-center text-slate-500 dark:text-[#A1A1AA]">${w}</td>
                <td class="p-4 text-sm font-semibold text-slate-800 dark:text-white">${c.itemCode||"-"}</td>
                <td class="p-4">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${c.name}</p>
                </td>
                <td class="p-4 text-right">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${(c.mto||0).toLocaleString("id-ID")}</p>
                </td>
                <td class="p-4 text-right">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${d.toLocaleString("id-ID")}</p>
                    ${m!==d?`<p class="text-[10px] text-blue-500 dark:text-blue-400 font-semibold mt-0.5">Total PO: ${m.toLocaleString("id-ID")}</p>`:""}
                    ${(c.used||0)>0?`<p class="text-[10px] text-blue-500">Terpakai: ${(c.used||0).toLocaleString("id-ID")}</p>`:""}
                </td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA] text-center">${c.unit}</td>
                <td class="p-4 text-center">${p}</td>
                <td class="p-4 text-center">${h}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${c.poNumber||"-"}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${c.leadTime||"-"}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${c.description||"-"}</td>
                ${P!=="Viewer"?`
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="updateMaterialProgress('${c.id}')" class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center border border-blue-100 dark:border-transparent" title="Update Data Material"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="deleteMaterialItem('${c.id}')" class="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-transparent" title="Hapus"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </td>
                `:""}
            </tr>
        `}).join("");a.innerHTML=A+y+"</tbody>"}window.openAddMaterialModal=function(){const a=document.documentElement.classList.contains("dark");Swal.fire({title:"Tambah Daftar Material",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",html:`
            <input id="swal-m-code" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Kode Item (Opsional, cth: ITM-001)">
            <input id="swal-m-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Item Material (cth: Semen Portland)">
            <input id="swal-m-mto" type="number" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Volume MTO (Angka)">
            <input id="swal-m-target" type="number" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Quantity PO (Angka)">
            <input id="swal-m-unit" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Satuan (cth: Sak / Ton / m3)">
            <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                <option value="Belum PO">Status: Belum PO</option>
                <option value="Sudah PO belum Payment">Status: Sudah PO belum Payment</option>
                <option value="Sudah PO dan Payment">Status: Sudah PO dan Payment</option>
            </select>
            <input id="swal-m-pono" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Nomor PO (Opsional, cth: PO-001/2024)">
            <input id="swal-m-lead" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Lead Time / Remarks (Opsional)">
            <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2" placeholder="Keterangan (Opsional)"></textarea>
        `,showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:a?"#2A2A2A":"#64748B",confirmButtonText:"Simpan",didOpen:()=>{const t=document.getElementById("swal-m-code"),e=document.getElementById("swal-m-name"),o=document.getElementById("swal-m-mto"),n=document.getElementById("swal-m-unit");t&&t.addEventListener("input",s=>{const r=s.target.value.trim().toUpperCase(),l=k.find(i=>i.itemCode&&i.itemCode.trim().toUpperCase()===r);l?(e.value=l.name||"",o.value=l.mto||"",n.value=l.unit||"",[e,o,n].forEach(i=>i.classList.add("bg-blue-50","dark:bg-blue-900/20","border-blue-300","dark:border-blue-700"))):[e,o,n].forEach(i=>i.classList.remove("bg-blue-50","dark:bg-blue-900/20","border-blue-300","dark:border-blue-700"))})},preConfirm:()=>{const t=document.getElementById("swal-m-code").value,e=document.getElementById("swal-m-name").value,o=parseFloat(document.getElementById("swal-m-mto").value)||0,n=parseFloat(document.getElementById("swal-m-target").value),s=document.getElementById("swal-m-unit").value,r=document.getElementById("swal-m-po").value,l=document.getElementById("swal-m-pono").value,i=document.getElementById("swal-m-lead").value,f=document.getElementById("swal-m-desc").value;return!e||!s||isNaN(n)?(Swal.showValidationMessage("Item Material, Quantity PO, dan Satuan wajib diisi!"),!1):{projectId:I,itemCode:t,name:e,unit:s,mto:o,target:n,used:0,poStatus:r,poNumber:l,leadTime:i,description:f,timestamp:Date.now()}}}).then(async t=>{if(t.isConfirmed){Swal.fire({title:"Menyimpan...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});const e=t.value;await Q(e)?(Swal.fire({icon:"success",title:"Berhasil",text:"Material ditambahkan sebagai data baru.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"}),E()):Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan server.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"})}})};window.filterByPoStatus=function(a){D=a,x=1,T()};window.filterBySearch=function(a){N=a,x=1,T()};window.prevPage=function(){x>1&&(x--,T())};window.nextPage=function(){const a=M(),t=Math.ceil(a.length/O);x<t&&(x++,T())};window.exportToExcel=function(){let a=M();if(a.length===0){Swal.fire("Info","Tidak ada data material untuk diexport.","info");return}const t={};k.forEach(r=>{if(r.itemCode&&r.itemCode.trim()!==""){const l=r.itemCode.trim().toUpperCase();t[l]=(t[l]||0)+(r.target||0)}});const e=a.map((r,l)=>{const i=r.mto||0,f=r.target||0;let b=f;r.itemCode&&r.itemCode.trim()!==""&&(b=t[r.itemCode.trim().toUpperCase()]||f);let A="Belum Terpenuhi";return b>i?A="Over Quantity":b===i&&i>0&&(A="Sudah Terpenuhi"),{No:l+1,"Kode Item":r.itemCode||"-","Item Material":r.name,"Volume MTO":r.mto||0,"Quantity PO":r.target,Satuan:r.unit,"Status Material":A,"Status PO":r.poStatus||"Belum PO","No PO":r.poNumber||"-","Lead Time / Remarks":r.leadTime||"-",Keterangan:r.description||"-"}}),o=XLSX.utils.json_to_sheet(e),n=XLSX.utils.book_new();XLSX.utils.book_append_sheet(n,o,"Daftar Material");const s=g?g.name.replace(/[^a-z0-9]/gi,"_"):"Proyek";XLSX.writeFile(n,`Logistik_Material_${s}.xlsx`)};window.exportToPDF=function(){let a=M();if(a.length===0){Swal.fire("Info","Tidak ada data material untuk diexport.","info");return}const{jsPDF:t}=window.jspdf,e=new t("landscape");e.setFontSize(16),e.text(`Laporan Monitoring Material - ${g?g.name:""}`,14,20),e.setFontSize(10),e.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`,14,28);const o=["No","Kode Item","Item Material","MTO","Quantity PO","Satuan","Status Material","Status PO","No PO","Lead Time","Keterangan"],n=[],s={};k.forEach(l=>{if(l.itemCode&&l.itemCode.trim()!==""){const i=l.itemCode.trim().toUpperCase();s[i]=(s[i]||0)+(l.target||0)}}),a.forEach((l,i)=>{const f=l.mto||0,b=l.target||0;let A=b;l.itemCode&&l.itemCode.trim()!==""&&(A=s[l.itemCode.trim().toUpperCase()]||b);let y="Belum Terpenuhi";A>f?y="Over Quantity":A===f&&f>0&&(y="Sudah Terpenuhi"),n.push([i+1,l.itemCode||"-",l.name,(l.mto||0).toLocaleString("id-ID"),l.target.toLocaleString("id-ID"),l.unit,y,l.poStatus||"Belum PO",l.poNumber||"-",l.leadTime||"-",l.description||"-"])}),e.autoTable({head:[o],body:n,startY:35,theme:"grid",styles:{fontSize:9,font:"helvetica"},headStyles:{fillColor:[59,130,246]}});const r=g?g.name.replace(/[^a-z0-9]/gi,"_"):"Proyek";e.save(`Logistik_Material_${r}.pdf`)};window.showImportInstructions=function(){const a=document.documentElement.classList.contains("dark");Swal.fire({title:"Panduan Import Excel",width:"600px",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",html:`
            <div class="text-left text-sm mb-4 text-slate-600 dark:text-[#A1A1AA]">
                <p class="mb-3">Pastikan file Excel Anda memiliki struktur kolom (baris pertama) seperti contoh tabel berikut:</p>
                <div class="overflow-x-auto border border-slate-200 dark:border-[#2A2A2A] rounded-lg mb-4">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 dark:bg-[#121212] font-semibold text-slate-700 dark:text-white">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Kode Item</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Item Material</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Volume MTO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Quantity PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Satuan</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Status PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Lead Time / Remarks</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-600 dark:text-[#A1A1AA]">
                            <tr>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">1</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">ITM-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Semen Portland</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">600</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">500</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sak</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sudah PO dan Payment</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">PO-2024-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">2 Hari</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Vendor A</td>
                            </tr>
                            <tr>
                                <td class="p-2">2</td>
                                <td class="p-2">ITM-002</td>
                                <td class="p-2">Besi Beton 12mm</td>
                                <td class="p-2">1500</td>
                                <td class="p-2">1200</td>
                                <td class="p-2">Btg</td>
                                <td class="p-2">Belum PO</td>
                                <td class="p-2">-</td>
                                <td class="p-2">1 Minggu</td>
                                <td class="p-2">Urgent</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <ul class="list-disc pl-5 space-y-1 text-xs mb-4">
                    <li>Kolom <b>Item Material</b>, <b>Quantity PO</b>, dan <b>Satuan</b> wajib diisi.</li>
                    <li>Sistem dapat mendeteksi variasi nama kolom secara otomatis (misal: <i>Item, Target, Remarks</i>).</li>
                </ul>
                <button onclick="downloadExcelTemplate()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold underline transition-colors"><i class="fas fa-download mr-1"></i> Download Template Excel Kosong</button>
            </div>
        `,showCancelButton:!0,confirmButtonText:'<i class="fas fa-file-upload mr-2"></i> Pilih File',cancelButtonText:"Batal",confirmButtonColor:"#3B82F6",cancelButtonColor:a?"#2A2A2A":"#64748B"}).then(t=>{t.isConfirmed&&document.getElementById("import-excel-file").click()})};window.downloadExcelTemplate=function(){const a=[{No:1,"Kode Item":"ITM-001","Item Material":"Semen Portland","Volume MTO":600,"Quantity PO":500,Satuan:"Sak","Status PO":"Sudah PO dan Payment","No PO":"PO-2024-001","Lead Time / Remarks":"2 Hari",Keterangan:"Vendor A"},{No:2,"Kode Item":"ITM-002","Item Material":"Batu Bata Merah","Volume MTO":12e3,"Quantity PO":1e4,Satuan:"Pcs","Status PO":"Sudah PO belum Payment","No PO":"PO-2024-002","Lead Time / Remarks":"5 Hari",Keterangan:""},{No:3,"Kode Item":"ITM-003","Item Material":"Pipa PVC 4 Inch","Volume MTO":200,"Quantity PO":150,Satuan:"Batang","Status PO":"Belum PO","No PO":"","Lead Time / Remarks":"Ready Stock",Keterangan:"Gudang Pusat"}],t=XLSX.utils.json_to_sheet(a),e=XLSX.utils.book_new();XLSX.utils.book_append_sheet(e,t,"Template_Material"),XLSX.writeFile(e,"Template_Import_Material.xlsx")};window.handleImportExcel=function(a){const t=a.target.files[0];if(!t)return;const e=document.documentElement.classList.contains("dark"),o=new FileReader;o.onload=async function(n){try{const s=new Uint8Array(n.target.result),r=XLSX.read(s,{type:"array"}),l=r.SheetNames[0],i=r.Sheets[l],f=XLSX.utils.sheet_to_json(i);if(f.length===0)return a.target.value="",Swal.fire({icon:"warning",title:"Data Kosong",text:"File Excel kosong!",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"});let b=new Set;f.forEach(d=>Object.keys(d).forEach(m=>b.add(m))),b=Array.from(b);const A=[{id:"map-no",label:"No",aliases:["no","nomor","number"]},{id:"map-code",label:"Kode Item",aliases:["kode","item code","kode item"]},{id:"map-name",label:"Item Material *",aliases:["nama","item","material","deskripsi"],required:!0},{id:"map-mto",label:"Volume MTO",aliases:["mto","volume","kebutuhan"]},{id:"map-target",label:"Quantity PO *",aliases:["qty","target","jumlah","quantity","po"],required:!0},{id:"map-unit",label:"Satuan *",aliases:["unit","ukuran"],required:!0},{id:"map-po",label:"Status PO",aliases:["status po","status pembayaran","status"]},{id:"map-pono",label:"No PO",aliases:["no po","nomor po","po number","po"]},{id:"map-lead",label:"Lead Time / Remarks",aliases:["lead time","remarks","waktu"]},{id:"map-desc",label:"Keterangan",aliases:["desc","catatan","vendor"]}];let y=`
                <div class="text-left text-sm text-slate-600 dark:text-[#A1A1AA] mb-4">
                    Sistem membaca kolom yang berbeda. Silakan sesuaikan kolom dari file Excel Anda dengan format sistem di bawah ini:
                </div>
                <div class="space-y-3 text-left">
            `;A.forEach(d=>{let m='<option value="">-- Abaikan / Tidak Ada --</option>',p=!1;b.forEach(h=>{let S=h.toLowerCase(),B=d.label.toLowerCase().replace(" *",""),C=!p&&(S.includes(B)||d.aliases.some(L=>S.includes(L)));C&&(p=!0),m+=`<option value="${h}" ${C?"selected":""}>${h}</option>`}),y+=`
                    <div>
                        <label class="block text-xs font-semibold text-slate-800 dark:text-white mb-1">${d.label}</label>
                        <select id="${d.id}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded p-2 outline-none text-slate-800 dark:text-white text-sm focus:border-blue-500">
                            ${m}
                        </select>
                    </div>
                `}),y+="</div>";const c=await Swal.fire({title:"Mapping Kolom Excel",html:y,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Lanjut Pratinjau",cancelButtonText:"Batal",preConfirm:()=>{const d={};let m=[];return A.forEach(p=>{const h=document.getElementById(p.id).value;p.required&&!h&&m.push(p.label.replace(" *","")),d[p.id]=h}),m.length>0?(Swal.showValidationMessage(`Kolom ${m.join(", ")} wajib dipetakan!`),!1):d}});if(!c.isConfirmed){a.target.value="";return}const u=c.value,w=[];for(const d of f){const m=u["map-no"]?d[u["map-no"]]:"",p=u["map-code"]?d[u["map-code"]]:"",h=u["map-name"]?d[u["map-name"]]:"",S=u["map-mto"]?d[u["map-mto"]]:null;let B=S!=null?parseFloat(S):0;const C=u["map-target"]?d[u["map-target"]]:null,L=u["map-unit"]?d[u["map-unit"]]:"",j=u["map-po"]?d[u["map-po"]]:"Belum PO",F=u["map-pono"]?d[u["map-pono"]]:"",K=u["map-lead"]?d[u["map-lead"]]:"",_=u["map-desc"]?d[u["map-desc"]]:"";if(h&&L&&C!==null&&C!==void 0){const U=parseFloat(C);if(!isNaN(U)){const $=p?String(p).trim():"";if($!==""){const V=k.find(H=>H.itemCode&&H.itemCode.trim().toUpperCase()===$.toUpperCase());V&&(isNaN(B)||B===0)&&(B=V.mto||0)}w.push({projectId:I,no:m,itemCode:$,name:String(h).trim(),unit:String(L).trim(),mto:isNaN(B)?0:B,target:U,used:0,poStatus:j?String(j).trim():"Belum PO",poNumber:F?String(F).trim():"",leadTime:K?String(K).trim():"",description:_?String(_).trim():"",timestamp:Date.now()})}}}if(w.length===0)return a.target.value="",Swal.fire({icon:"warning",title:"Data Kosong",text:"Tidak ada baris data yang valid berdasarkan pemetaan kolom Anda.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"});let v=`
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA] mb-4 text-left">Ditemukan <b>${w.length}</b> data valid yang siap diimport.</p>
                <div class="max-h-60 overflow-auto text-left text-sm bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-3">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-500 dark:text-[#A1A1AA]">
                                <th class="py-2 text-center w-12">No</th>
                                <th class="py-2 text-left w-1/5">Kode</th>
                                <th class="py-2 text-left w-2/5">Item Material</th>
                                <th class="py-2 text-center w-1/5">MTO</th>
                                <th class="py-2 text-center w-1/5">Qty PO</th>
                            </tr>
                        </thead>
                        <tbody>
            `;w.slice(0,10).forEach(d=>{v+=`
                    <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-800 dark:text-white last:border-0">
                        <td class="py-2 text-center">${d.no||"-"}</td>
                        <td class="py-2 truncate max-w-[100px]" title="${d.itemCode}">${d.itemCode||"-"}</td>
                        <td class="py-2 truncate max-w-[150px]" title="${d.name}">${d.name}</td>
                        <td class="py-2 text-center">${(d.mto||0).toLocaleString("id-ID")}</td>
                        <td class="py-2 text-center">${d.target.toLocaleString("id-ID")} ${d.unit}</td>
                    </tr>
                `}),v+="</tbody></table></div>",w.length>10&&(v+=`<p class="text-xs text-center text-slate-500 dark:text-[#A1A1AA] mt-3 italic">...dan ${w.length-10} baris lainnya.</p>`),Swal.fire({title:"Pratinjau Import",html:v,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Ya, Import Sekarang",cancelButtonText:"Batal"}).then(async d=>{if(d.isConfirmed){Swal.fire({title:"Memproses Import...",text:`Mengimport ${w.length} baris material.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});let m=0;for(const p of w)await Q(p),m++;Swal.fire({icon:"success",title:"Import Selesai",text:`Berhasil memproses ${m} baris data material.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"}),E()}}).finally(()=>{a.target.value=""})}catch{Swal.fire({icon:"error",title:"Gagal",text:"Format Excel tidak valid.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}),a.target.value=""}},o.readAsArrayBuffer(t)};window.updateMaterialProgress=function(a){const t=k.find(o=>o.id===a);if(!t)return;const e=document.documentElement.classList.contains("dark");Swal.fire({title:`Update Data Material<br><span class="text-sm font-normal text-blue-500">${t.name}</span>`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",html:`
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Volume MTO</label>
                <input id="swal-m-mto" type="number" value="${t.mto||0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Quantity PO</label>
                <input id="swal-m-target" type="number" value="${t.target||0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Total Digunakan Baru</label>
                <input id="swal-m-used" type="number" value="${t.used||0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Status PO</label>
                <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                    <option value="Belum PO" ${t.poStatus==="Belum PO"||!t.poStatus?"selected":""}>Belum PO</option>
                    <option value="Sudah PO belum Payment" ${t.poStatus==="Sudah PO belum Payment"?"selected":""}>Sudah PO belum Payment</option>
                    <option value="Sudah PO dan Payment" ${t.poStatus==="Sudah PO dan Payment"?"selected":""}>Sudah PO dan Payment</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Nomor PO</label>
                <input id="swal-m-pono" type="text" value="${t.poNumber||""}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Nomor PO (Opsional)">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Lead Time / Remarks</label>
                <input id="swal-m-lead" type="text" value="${t.leadTime||""}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Keterangan</label>
                <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2">${t.description||""}</textarea>
            </div>
        `,showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Update",preConfirm:()=>{const o=parseFloat(document.getElementById("swal-m-mto").value)||0,n=parseFloat(document.getElementById("swal-m-target").value)||0,s=parseFloat(document.getElementById("swal-m-used").value)||0,r=document.getElementById("swal-m-po").value,l=document.getElementById("swal-m-pono").value,i=document.getElementById("swal-m-lead").value,f=document.getElementById("swal-m-desc").value;return isNaN(n)||n<0?(Swal.showValidationMessage("Masukkan Quantity PO yang valid!"),!1):{mto:o,target:n,used:s,poStatus:r,poNumber:l,leadTime:i,description:f}}}).then(async o=>{if(o.isConfirmed){Swal.fire({title:"Mengupdate...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});try{if(await R(a,{mto:o.value.mto,target:o.value.target,used:o.value.used,poStatus:o.value.poStatus,poNumber:o.value.poNumber,leadTime:o.value.leadTime,description:o.value.description})!==!1){const s=k.findIndex(r=>r.id===a);s!==-1&&(k[s]={...k[s],...o.value}),q(),T(),Swal.fire({icon:"success",title:"Terupdate",text:"Data material diperbarui.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"})}else Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan pada database.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}catch(n){console.error("Update error:",n),Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan sistem saat mengupdate data.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}}})};window.deleteMaterialItem=function(a){if(!a||a==="undefined"){Swal.fire({icon:"error",title:"Data Tidak Valid",text:"ID Material tidak terdeteksi. Pastikan getMaterialsByProjectId di firebase-service.js me-return id.",background:document.documentElement.classList.contains("dark")?"#1A1A1A":"#ffffff",color:document.documentElement.classList.contains("dark")?"#ffffff":"#1e293b"});return}const t=document.documentElement.classList.contains("dark");Swal.fire({title:"Hapus Item Material?",icon:"warning",showCancelButton:!0,confirmButtonColor:"#EF4444",cancelButtonColor:t?"#2A2A2A":"#64748B",confirmButtonText:"Hapus",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"}).then(async e=>{if(e.isConfirmed){Swal.fire({title:"Menghapus...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});try{await X(a)!==!1?(await E(),Swal.fire({icon:"success",title:"Terhapus",text:"Item material berhasil dihapus.",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"})):Swal.fire({icon:"error",title:"Gagal",text:"Gagal menghapus item dari database. Periksa Aturan (Rules) Firebase Anda.",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"})}catch(o){console.error("Delete error:",o),Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan sistem saat menghapus.",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"})}}})};window.toggleAllMaterialChecks=function(a){document.querySelectorAll(".material-checkbox").forEach(e=>{e.checked=a.checked}),updateSelectedCount()};window.updateSelectedCount=function(){const t=document.querySelectorAll(".material-checkbox:checked").length,e=document.getElementById("aksi-title"),o=document.getElementById("bulk-actions"),n=document.getElementById("count-selected-edit"),s=document.getElementById("count-selected-delete"),r=document.getElementById("check-all-materials");if(t>0?(e&&e.classList.add("hidden"),o&&(o.classList.remove("hidden"),o.classList.add("flex")),n&&(n.innerText=t),s&&(s.innerText=t)):(e&&e.classList.remove("hidden"),o&&(o.classList.add("hidden"),o.classList.remove("flex"))),r){const l=document.querySelectorAll(".material-checkbox").length;r.checked=t>0&&t===l}};window.deleteSelectedMaterials=function(){const a=document.querySelectorAll(".material-checkbox:checked"),t=Array.from(a).map(o=>o.value).filter(o=>o&&o!=="undefined");if(t.length===0)return;const e=document.documentElement.classList.contains("dark");Swal.fire({title:`Hapus ${t.length} Item?`,text:"Data material yang terpilih akan dihapus permanen!",icon:"warning",showCancelButton:!0,confirmButtonColor:"#EF4444",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Ya, Hapus Semua",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}).then(async o=>{if(o.isConfirmed){Swal.fire({title:"Menghapus...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});let n=0;try{for(const r of t)await X(r)!==!1&&n++;await E();const s=document.getElementById("check-all-materials");s&&(s.checked=!1),n>0?Swal.fire({icon:"success",title:"Terhapus",text:`${n} data berhasil dihapus.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"}):Swal.fire({icon:"error",title:"Gagal",text:"Gagal menghapus data dari database. Periksa Aturan (Rules) Firebase Anda.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}catch(s){console.error("Delete massal error:",s),Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan sistem saat menghapus data.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}}})};window.editSelectedMaterials=function(){const a=document.querySelectorAll(".material-checkbox:checked"),t=Array.from(a).map(o=>o.value).filter(o=>o&&o!=="undefined");if(t.length===0)return;const e=document.documentElement.classList.contains("dark");Swal.fire({title:`Update ${t.length} Material Terpilih`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",html:`
            <p class="text-sm text-slate-500 dark:text-slate-400 text-left mb-4">Hanya field yang diisi yang akan diupdate. Kosongkan field jika tidak ingin mengubah nilainya.</p>
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Status PO</label>
                    <select id="swal-bulk-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                        <option value="">-- Jangan Ubah --</option>
                        <option value="Belum PO">Belum PO</option>
                        <option value="Sudah PO belum Payment">Sudah PO belum Payment</option>
                        <option value="Sudah PO dan Payment">Sudah PO dan Payment</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Nomor PO</label>
                    <input id="swal-bulk-pono" type="text" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Isi untuk mengubah semua">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Lead Time / Remarks</label>
                    <input id="swal-bulk-lead" type="text" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Isi untuk mengubah semua">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Keterangan</glabel>
                    <textarea id="swal-bulk-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2" placeholder="Isi untuk mengubah semua"></textarea>
                </div>
            </div>
        `,showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Update Semua",preConfirm:()=>{const o=document.getElementById("swal-bulk-po").value,n=document.getElementById("swal-bulk-pono").value,s=document.getElementById("swal-bulk-lead").value,r=document.getElementById("swal-bulk-desc").value,l={};return o&&(l.poStatus=o),n&&(l.poNumber=n),s&&(l.leadTime=s),r&&(l.description=r),Object.keys(l).length===0?(Swal.showValidationMessage("Tidak ada perubahan yang diisi."),!1):l}}).then(async o=>{if(o.isConfirmed){const n=o.value;Swal.fire({title:"Mengupdate...",text:`Memproses ${t.length} data...`,allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});let s=0;try{for(const l of t)await R(l,n)!==!1&&s++;await E();const r=document.getElementById("check-all-materials");r&&(r.checked=!1),s>0?Swal.fire({icon:"success",title:"Update Berhasil",text:`${s} data berhasil diupdate.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#3B82F6"}):Swal.fire({icon:"error",title:"Gagal",text:"Gagal mengupdate data di database.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}catch(r){console.error("Bulk update error:",r),Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan sistem saat mengupdate data.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"})}}})};
