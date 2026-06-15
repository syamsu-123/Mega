import{F,G as E,H as T,I as $}from"./firebase-service-CVGET8i4.js";let b=[],w="",v=localStorage.getItem("userRole")||"Viewer";function D(){const e=document.createElement("style");e.innerHTML=`
        .goog-te-banner-frame.skiptranslate, .skiptranslate > iframe { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
    `,document.head.appendChild(e),window.googleTranslateElementInit=function(){new google.translate.TranslateElement({pageLanguage:"id",includedLanguages:"en,id",autoDisplay:!1},"google_translate_element")};const t=document.createElement("script");t.type="text/javascript",t.src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",document.body.appendChild(t);const a=document.createElement("div");a.id="google_translate_element",document.body.appendChild(a);let i=(l=>{const m=document.cookie.match(new RegExp("(^| )"+l+"=([^;]+)"));return m?m[2]:null})("googtrans")==="/id/en"?"EN":"ID";const f=l=>{l&&l.preventDefault();const m=i==="ID"?"/id/en":"/id/id";document.cookie=`googtrans=${m}; path=/`,document.cookie=`googtrans=${m}; domain=.${location.hostname}; path=/`,window.location.reload()},c=document.getElementById("themeToggle");if(c&&!document.getElementById("langToggleBtn")){const l=document.createElement("button");l.id="langToggleBtn",l.className="flex items-center justify-center gap-1.5 w-10 h-10 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",l.innerHTML='<i class="fas fa-globe text-lg"></i>',l.title=i==="ID"?"Switch to English":"Ganti ke Bahasa Indonesia",l.addEventListener("click",f),c.parentNode.insertBefore(l,c)}}D();document.addEventListener("DOMContentLoaded",async()=>{const e=document.getElementById("themeToggle");localStorage.getItem("theme")==="dark"||!localStorage.getItem("theme")&&window.matchMedia("(prefers-color-scheme: dark)").matches?(document.documentElement.classList.add("dark"),e&&(e.innerHTML='<i class="fas fa-sun text-lg"></i>')):(document.documentElement.classList.remove("dark"),e&&(e.innerHTML='<i class="fas fa-moon text-lg"></i>')),e&&e.addEventListener("click",()=>{document.documentElement.classList.toggle("dark");const t=document.documentElement.classList.contains("dark");localStorage.setItem("theme",t?"dark":"light"),e.innerHTML=t?'<i class="fas fa-sun text-lg"></i>':'<i class="fas fa-moon text-lg"></i>'}),v!=="Viewer"&&(document.getElementById("admin-actions").style.display="flex"),await g(),document.getElementById("loading-indicator").classList.add("hidden"),document.getElementById("main-content").classList.remove("hidden")});async function g(){b=await F(),M(),I()}function M(){const e=document.getElementById("supplier-stats"),t=b.length;let a=0;b.forEach(r=>{r.status==="Aktif"&&a++}),e.innerHTML=`
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Supplier Terdata</p>
                    <h3 class="text-3xl font-bold text-slate-800 dark:text-white">${t}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500"><i class="fas fa-users"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Supplier Aktif</p>
                    <h3 class="text-3xl font-bold text-[#22C55E]">${a}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-check-circle"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Barang Dilacak</p>
                    <h3 class="text-3xl font-bold text-[#FF7A00]">${t}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-orange-50 dark:bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00]"><i class="fas fa-box-open"></i></div>
            </div>
        </div>
    `}function I(){const e=document.getElementById("suppliers-table");let t=b;if(w.trim()!==""){const r=w.toLowerCase();t=t.filter(i=>i.name&&String(i.name).toLowerCase().includes(r)||i.material&&String(i.material).toLowerCase().includes(r))}if(t.length===0){e.innerHTML='<tr><td colspan="9" class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic">Tidak ada data supplier / harga.</td></tr>';return}let a=t.map((r,i)=>{let f=r.status==="Aktif"?'<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] px-2 py-1 rounded text-xs font-bold border border-green-200 dark:border-[#22C55E]/20">Aktif</span>':'<span class="bg-red-100 dark:bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 rounded text-xs font-bold border border-red-200 dark:border-[#EF4444]/20">Non-Aktif</span>';const c=r.price?new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(r.price):"-",l=r.timestamp?new Date(r.timestamp).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"-";return`
            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#121212] transition-colors">
                <td class="p-4 text-sm text-center text-slate-500 dark:text-[#A1A1AA]">${i+1}</td>
                <td class="p-4"><p class="text-sm font-semibold text-slate-800 dark:text-white">${r.name}</p></td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${r.material}</td>
                <td class="p-4 text-right">
                    <p class="text-sm font-bold text-[#FF7A00]">${c}</p>
                    <p class="text-[10px] text-slate-500 dark:text-[#A1A1AA]">per ${r.unit}</p>
                </td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${r.contact||"-"}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${l}</td>
                <td class="p-4 text-center">${f}</td>
                ${v!=="Viewer"?`
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editSupplierItem('${r.id}')" class="w-8 h-8 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center border border-orange-100 dark:border-transparent" title="Edit"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="deleteSupplierItem('${r.id}')" class="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-transparent" title="Hapus"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </td>
                `:""}
            </tr>
        `}).join("");e.innerHTML=`
        <thead>
            <tr class="text-xs uppercase text-slate-500 dark:text-[#A1A1AA] border-b border-slate-200 dark:border-[#2A2A2A]">
                <th class="p-4 font-semibold text-center w-12">No</th>
                <th class="p-4 font-semibold">Nama Supplier / Vendor</th>
                <th class="p-4 font-semibold">Bahan Material</th>
                <th class="p-4 font-semibold text-right">Harga Update</th>
                <th class="p-4 font-semibold">Kontak</th>
                <th class="p-4 font-semibold">Tanggal Update</th>
                <th class="p-4 font-semibold text-center">Status</th>
                ${v!=="Viewer"?'<th class="p-4 font-semibold text-center">Aksi</th>':""}
            </tr>
        </thead>
        <tbody>${a}</tbody>`}window.filterBySearch=function(e){w=e,I()};window.openAddSupplierModal=function(){const e=document.documentElement.classList.contains("dark");Swal.fire({title:"Tambah Supplier Baru",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",html:`
            <input id="swal-s-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Nama Supplier / Vendor">
            <input id="swal-s-mat" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Material Barang (cth: Besi Beton)">
            <div class="flex gap-3 mb-3">
                <input id="swal-s-price" type="number" class="w-2/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Harga Satuan (Rp)">
                <input id="swal-s-unit" class="w-1/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Satuan (cth: Kg)">
            </div>
            <input id="swal-s-contact" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Kontak (No Telepon / Email)">
            <select id="swal-s-status" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none cursor-pointer focus:border-[#FF7A00]">
                <option value="Aktif">Status: Aktif</option><option value="Non-Aktif">Status: Non-Aktif</option>
            </select>`,showCancelButton:!0,confirmButtonColor:"#FF7A00",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Simpan",preConfirm:()=>({name:document.getElementById("swal-s-name").value,material:document.getElementById("swal-s-mat").value,price:parseFloat(document.getElementById("swal-s-price").value)||0,unit:document.getElementById("swal-s-unit").value,contact:document.getElementById("swal-s-contact").value,status:document.getElementById("swal-s-status").value,timestamp:Date.now()})}).then(async t=>{t.isConfirmed&&(Swal.fire({title:"Menyimpan...",didOpen:()=>Swal.showLoading()}),await E(t.value),Swal.fire("Berhasil!","Data tersimpan.","success"),g())})};window.deleteSupplierItem=function(e){const t=document.documentElement.classList.contains("dark");Swal.fire({title:"Hapus Supplier?",icon:"warning",showCancelButton:!0,confirmButtonColor:"#EF4444",confirmButtonText:"Hapus",cancelButtonColor:t?"#2A2A2A":"#64748B",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"}).then(async a=>{a.isConfirmed&&(await T(e),Swal.fire("Terhapus!","Data dihapus.","success"),g())})};window.editSupplierItem=function(e){const t=b.find(r=>r.id===e);if(!t)return;const a=document.documentElement.classList.contains("dark");Swal.fire({title:"Edit Data Supplier",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",html:`
            <input id="swal-s-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Nama Supplier / Vendor" value="${t.name||""}">
            <input id="swal-s-mat" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Material Barang (cth: Besi Beton)" value="${t.material||""}">
            <div class="flex gap-3 mb-3">
                <input id="swal-s-price" type="number" class="w-2/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Harga Satuan (Rp)" value="${t.price||""}">
                <input id="swal-s-unit" class="w-1/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Satuan (cth: Kg)" value="${t.unit||""}">
            </div>
            <input id="swal-s-contact" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Kontak (No Telepon / Email)" value="${t.contact||""}">
            <select id="swal-s-status" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none cursor-pointer focus:border-blue-500">
                <option value="Aktif" ${t.status==="Aktif"?"selected":""}>Status: Aktif</option><option value="Non-Aktif" ${t.status==="Non-Aktif"?"selected":""}>Status: Non-Aktif</option>
            </select>`,showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:a?"#2A2A2A":"#64748B",confirmButtonText:"Update",preConfirm:()=>({name:document.getElementById("swal-s-name").value,material:document.getElementById("swal-s-mat").value,price:parseFloat(document.getElementById("swal-s-price").value)||0,unit:document.getElementById("swal-s-unit").value,contact:document.getElementById("swal-s-contact").value,status:document.getElementById("swal-s-status").value,timestamp:Date.now()})}).then(async r=>{r.isConfirmed&&(Swal.fire({title:"Menyimpan Perubahan...",didOpen:()=>Swal.showLoading()}),await $(e,r.value),Swal.fire("Berhasil!","Data diperbarui.","success"),g())})};window.showImportInstructions=function(){const e=document.documentElement.classList.contains("dark");Swal.fire({title:"Panduan Import Excel",width:"600px",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",html:`
            <div class="text-left text-sm mb-4 text-slate-600 dark:text-[#A1A1AA]">
                <p class="mb-3">Pastikan file Excel Anda memiliki struktur kolom (baris pertama) seperti contoh tabel berikut:</p>
                <div class="overflow-x-auto border border-slate-200 dark:border-[#2A2A2A] rounded-lg mb-4">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 dark:bg-[#121212] font-semibold text-slate-700 dark:text-white">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Nama Supplier/Vendor</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Bahan Material</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Harga</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Kontak</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-600 dark:text-[#A1A1AA]">
                            <tr>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">1</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">PT. Contoh Makmur</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Semen</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">50000</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">08123456789</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <ul class="list-disc pl-5 space-y-1 text-xs mb-4">
                    <li>Sistem dapat mendeteksi variasi nama kolom secara otomatis.</li>
                    <li>Kolom <b>Nama Supplier</b> wajib ada.</li>
                </ul>
            </div>
        `,showCancelButton:!0,confirmButtonText:'<i class="fas fa-file-upload mr-2"></i> Pilih File',cancelButtonText:"Batal",confirmButtonColor:"#3B82F6",cancelButtonColor:e?"#2A2A2A":"#64748B"}).then(t=>{t.isConfirmed&&document.getElementById("import-excel-file").click()})};window.handleImportExcel=function(e){const t=e.target.files[0];if(!t)return;const a=document.documentElement.classList.contains("dark"),r=new FileReader;r.onload=async function(i){try{const f=new Uint8Array(i.target.result),c=XLSX.read(f,{type:"array"}),l=c.SheetNames[0],m=c.Sheets[l],k=XLSX.utils.sheet_to_json(m);if(k.length===0)return e.target.value="",Swal.fire({icon:"warning",title:"Data Kosong",text:"File Excel kosong!",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"});let A=new Set;k.forEach(o=>Object.keys(o).forEach(n=>A.add(n))),A=Array.from(A);const y=[{id:"map-name",label:"Nama Supplier/Vendor *",aliases:["nama","supplier","vendor","perusahaan"],required:!0},{id:"map-material",label:"Bahan Material",aliases:["bahan","material","kategori","barang","jenis"]},{id:"map-price",label:"Harga",aliases:["harga","price","biaya","keterangan"]},{id:"map-contact",label:"Kontak",aliases:["kontak","no","telp","hp","email","telepon"]}];let x='<div class="text-left text-sm text-slate-600 dark:text-[#A1A1AA] mb-4">Pilih kolom Excel yang sesuai dengan format sistem:</div><div class="space-y-3 text-left">';y.forEach(o=>{let n='<option value="">-- Abaikan / Tidak Ada --</option>',s=!1;A.forEach(d=>{let p=d.toLowerCase(),C=o.label.toLowerCase().replace(" *",""),S=!s&&(p.includes(C)||o.aliases.some(L=>p.includes(L)));S&&(s=!0),n+=`<option value="${d}" ${S?"selected":""}>${d}</option>`}),x+=`<div><label class="block text-xs font-semibold text-slate-800 dark:text-white mb-1">${o.label}</label><select id="${o.id}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded p-2 outline-none text-slate-800 dark:text-white text-sm focus:border-blue-500">${n}</select></div>`}),x+="</div>";const B=await Swal.fire({title:"Mapping Kolom",html:x,background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:a?"#2A2A2A":"#64748B",confirmButtonText:"Lanjut Pratinjau",preConfirm:()=>{const o={};let n=[];return y.forEach(s=>{const d=document.getElementById(s.id).value;s.required&&!d&&n.push(s.label.replace(" *","")),o[s.id]=d}),n.length>0?(Swal.showValidationMessage(`Kolom ${n.join(", ")} wajib dipetakan!`),!1):o}});if(!B.isConfirmed){e.target.value="";return}const u=B.value,h=[];for(const o of k){const n=u["map-name"]?o[u["map-name"]]:"",s=u["map-material"]?o[u["map-material"]]:"",d=u["map-price"]?o[u["map-price"]]:"",p=u["map-contact"]?o[u["map-contact"]]:"";n&&h.push({name:String(n).trim(),material:s?String(s).trim():"",price:d&&parseFloat(String(d).replace(/[^0-9]/g,""))||0,unit:"",contact:p?String(p).trim():"",status:"Aktif",timestamp:Date.now()})}if(h.length===0)return e.target.value="",Swal.fire({icon:"warning",title:"Kosong",text:"Tidak ada data valid yang bisa diimport.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"});Swal.fire({title:"Konfirmasi Import",text:`Ditemukan ${h.length} data supplier. Import sekarang?`,icon:"question",showCancelButton:!0,confirmButtonColor:"#3B82F6",cancelButtonColor:a?"#2A2A2A":"#64748B",confirmButtonText:"Ya, Import",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"}).then(async o=>{if(o.isConfirmed){Swal.fire({title:"Memproses...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});let n=0;for(const s of h)await E(s),n++;Swal.fire({icon:"success",title:"Selesai",text:`${n} data berhasil diimport.`,background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"}),g()}}).finally(()=>{e.target.value=""})}catch{Swal.fire({icon:"error",title:"Error",text:"Gagal memproses file.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"}),e.target.value=""}},r.readAsArrayBuffer(t)};
