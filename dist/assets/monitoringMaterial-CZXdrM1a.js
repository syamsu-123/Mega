import{y as D,B as N,C as j,D as K,E as _}from"./firebase-service-oQMaTyfC.js";let x=null,i=null,w=[],F="All",C="",B=localStorage.getItem("userRole")||"Viewer";document.addEventListener("DOMContentLoaded",async()=>{if(localStorage.getItem("theme")==="dark"||!localStorage.getItem("theme")&&window.matchMedia("(prefers-color-scheme: dark)").matches?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),x=new URLSearchParams(window.location.search).get("id"),!x){window.location.href="dashboard.html";return}if(i=await D(x),!i){const t=document.documentElement.classList.contains("dark");Swal.fire({icon:"error",title:"Proyek Tidak Ditemukan",text:"Mengarahkan kembali ke dashboard...",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"}).then(()=>window.location.href="dashboard.html");return}if(B==="Viewer"){const t=localStorage.getItem("projectCode")||localStorage.getItem("userName")||"",e=document.documentElement.classList.contains("dark"),o=String(t).split("@")[0].replace(/\s+/g,"").toUpperCase();if((i.code?String(i.code).replace(/\s+/g,"").toUpperCase():"")!==o){Swal.fire({icon:"error",title:"Akses Ditolak",text:"Anda tidak memiliki izin melihat logistik proyek ini.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}).then(()=>window.location.href="dashboard.html");return}}document.title=`Monitoring Material - ${i.name}`,document.getElementById("header-project-name").innerText=i.code?`[${i.code}] ${i.name}`:i.name,B!=="Viewer"&&(document.getElementById("admin-actions").style.display="flex"),await S(),document.getElementById("loading-indicator").classList.add("hidden"),document.getElementById("main-content").classList.remove("hidden")});async function S(){w=await N(x),X(),O()}function X(){const a=document.getElementById("material-stats");let t=w.length,e=0,o=0;w.forEach(r=>{(r.target-r.used)/r.target*100<=15?e++:o++}),a.innerHTML=`
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Jenis Material</p>
                    <h3 class="text-3xl font-bold text-slate-800 dark:text-white">${t}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><i class="fas fa-boxes"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Stok Aman</p>
                    <h3 class="text-3xl font-bold text-[#22C55E]">${o}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-check-circle"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Stok Kritis / Menipis</p>
                    <h3 class="text-3xl font-bold text-[#EF4444]">${e}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-[#EF4444]"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
        </div>
    `}function M(){let a=w;if(F!=="All"&&(a=a.filter(t=>(t.poStatus||"Belum PO")===F)),C.trim()!==""){const t=C.toLowerCase();a=a.filter(e=>e.name&&String(e.name).toLowerCase().includes(t)||e.itemCode&&String(e.itemCode).toLowerCase().includes(t))}return a}function O(){const a=document.getElementById("materials-table");let t=M();if(t.length===0){a.innerHTML='<tr><td colspan="10" class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic">Tidak ada data material yang sesuai.</td></tr>';return}let e=`
        <thead>
            <tr class="text-xs uppercase text-slate-500 dark:text-[#A1A1AA] border-b border-slate-200 dark:border-[#2A2A2A]">
                <th class="p-4 font-semibold text-center w-12">No</th>
                <th class="p-4 font-semibold">Kode Item</th>
                <th class="p-4 font-semibold w-1/5">Item Material</th>
                <th class="p-4 font-semibold text-right">Quantity</th>
                <th class="p-4 font-semibold text-center">Satuan</th>
                <th class="p-4 font-semibold text-center">Status Material</th>
                <th class="p-4 font-semibold text-center">Status PO</th>
                <th class="p-4 font-semibold">No PO</th>
                <th class="p-4 font-semibold">Lead Time / Remarks</th>
                <th class="p-4 font-semibold">Keterangan</th>
                ${B!=="Viewer"?'<th class="p-4 font-semibold text-center">Aksi</th>':""}
            </tr>
        </thead>
        <tbody>
    `,o=t.map((r,s)=>{const d=Math.max(0,r.target-r.used),u=r.target>0?d/r.target*100:0;let f=u>15?'<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-xs font-bold">Aman</span>':u>0?'<span class="bg-orange-100 dark:bg-[#FF7A00]/10 text-[#FF7A00] border border-orange-200 dark:border-[#FF7A00]/20 px-2.5 py-1 rounded text-xs font-bold">Kritis</span>':'<span class="bg-red-100 dark:bg-[#EF4444]/10 text-[#EF4444] border border-red-200 dark:border-[#EF4444]/20 px-2.5 py-1 rounded text-xs font-bold">Habis</span>',m='<span class="bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">Belum PO</span>';return r.poStatus==="Sudah PO dan Payment"?m='<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO & Paid</span>':r.poStatus==="Sudah PO belum Payment"&&(m='<span class="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO Unpaid</span>'),`
            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#121212] transition-colors">
                <td class="p-4 text-sm text-center text-slate-500 dark:text-[#A1A1AA]">${s+1}</td>
                <td class="p-4 text-sm font-semibold text-slate-800 dark:text-white">${r.itemCode||"-"}</td>
                <td class="p-4">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${r.name}</p>
                </td>
                <td class="p-4 text-right">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${r.target.toLocaleString("id-ID")}</p>
                    ${(r.used||0)>0?`<p class="text-[10px] text-[#FF7A00]">Terpakai: ${(r.used||0).toLocaleString("id-ID")}</p>`:""}
                </td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA] text-center">${r.unit}</td>
                <td class="p-4 text-center">${f}</td>
                <td class="p-4 text-center">${m}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${r.poNumber||"-"}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${r.leadTime||"-"}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${r.description||"-"}</td>
                ${B!=="Viewer"?`
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="updateMaterialProgress('${r.id}')" class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center border border-blue-100 dark:border-transparent" title="Update Data Material"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="deleteMaterialItem('${r.id}')" class="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-transparent" title="Hapus"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </td>
                `:""}
            </tr>
        `}).join("");a.innerHTML=e+o+"</tbody>"}window.openAddMaterialModal=function(){const a=document.documentElement.classList.contains("dark");Swal.fire({title:"Tambah Daftar Material",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",html:`
            <input id="swal-m-code" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Kode Item (Opsional, cth: ITM-001)">
            <input id="swal-m-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Item Material (cth: Semen Portland)">
            <input id="swal-m-target" type="number" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Quantity (Angka)">
            <input id="swal-m-unit" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Satuan (cth: Sak / Ton / m3)">
            <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00] cursor-pointer">
                <option value="Belum PO">Status: Belum PO</option>
                <option value="Sudah PO belum Payment">Status: Sudah PO belum Payment</option>
                <option value="Sudah PO dan Payment">Status: Sudah PO dan Payment</option>
            </select>
            <input id="swal-m-pono" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Nomor PO (Opsional, cth: PO-001/2024)">
            <input id="swal-m-lead" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Lead Time / Remarks (Opsional)">
            <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00] resize-none" rows="2" placeholder="Keterangan (Opsional)"></textarea>
        `,showCancelButton:!0,confirmButtonColor:"#FF7A00",cancelButtonColor:a?"#2A2A2A":"#64748B",confirmButtonText:"Simpan",preConfirm:()=>{const t=document.getElementById("swal-m-code").value,e=document.getElementById("swal-m-name").value,o=parseFloat(document.getElementById("swal-m-target").value),r=document.getElementById("swal-m-unit").value,s=document.getElementById("swal-m-po").value,d=document.getElementById("swal-m-pono").value,u=document.getElementById("swal-m-lead").value,f=document.getElementById("swal-m-desc").value;return!e||!r||isNaN(o)?(Swal.showValidationMessage("Item Material, Quantity, dan Satuan wajib diisi!"),!1):{projectId:x,itemCode:t,name:e,unit:r,target:o,used:0,poStatus:s,poNumber:d,leadTime:u,description:f,timestamp:Date.now()}}}).then(async t=>{t.isConfirmed&&(Swal.fire({title:"Menyimpan...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()}),await j(t.value)?(Swal.fire({icon:"success",title:"Berhasil",text:"Material ditambahkan.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",confirmButtonColor:"#FF7A00"}),S()):Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan server.",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b"}))})};window.filterByPoStatus=function(a){F=a,O()};window.filterBySearch=function(a){C=a,O()};window.exportToExcel=function(){let a=M();if(a.length===0){Swal.fire("Info","Tidak ada data material untuk diexport.","info");return}const t=a.map((s,d)=>{const u=Math.max(0,s.target-s.used),f=s.target>0?u/s.target*100:0;let m=f>15?"Aman":f>0?"Kritis":"Habis";return{No:d+1,"Kode Item":s.itemCode||"-","Item Material":s.name,Quantity:s.target,Satuan:s.unit,"Status Material":m,"Status PO":s.poStatus||"Belum PO","No PO":s.poNumber||"-","Lead Time / Remarks":s.leadTime||"-",Keterangan:s.description||"-"}}),e=XLSX.utils.json_to_sheet(t),o=XLSX.utils.book_new();XLSX.utils.book_append_sheet(o,e,"Daftar Material");const r=i?i.name.replace(/[^a-z0-9]/gi,"_"):"Proyek";XLSX.writeFile(o,`Logistik_Material_${r}.xlsx`)};window.exportToPDF=function(){let a=M();if(a.length===0){Swal.fire("Info","Tidak ada data material untuk diexport.","info");return}const{jsPDF:t}=window.jspdf,e=new t("landscape");e.setFontSize(16),e.text(`Laporan Monitoring Material - ${i?i.name:""}`,14,20),e.setFontSize(10),e.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`,14,28);const o=["No","Kode Item","Item Material","Qty","Satuan","Status Material","Status PO","No PO","Lead Time","Keterangan"],r=[];a.forEach((d,u)=>{const f=Math.max(0,d.target-d.used),m=d.target>0?f/d.target*100:0;let g=m>15?"Aman":m>0?"Kritis":"Habis";r.push([u+1,d.itemCode||"-",d.name,d.target.toLocaleString("id-ID"),d.unit,g,d.poStatus||"Belum PO",d.poNumber||"-",d.leadTime||"-",d.description||"-"])}),e.autoTable({head:[o],body:r,startY:35,theme:"grid",styles:{fontSize:9,font:"helvetica"},headStyles:{fillColor:[255,122,0]}});const s=i?i.name.replace(/[^a-z0-9]/gi,"_"):"Proyek";e.save(`Logistik_Material_${s}.pdf`)};window.showImportInstructions=function(){const a=document.documentElement.classList.contains("dark");Swal.fire({title:"Panduan Import Excel",width:"600px",background:a?"#1A1A1A":"#ffffff",color:a?"#ffffff":"#1e293b",html:`
            <div class="text-left text-sm mb-4 text-slate-600 dark:text-[#A1A1AA]">
                <p class="mb-3">Pastikan file Excel Anda memiliki struktur kolom (baris pertama) seperti contoh tabel berikut:</p>
                <div class="overflow-x-auto border border-slate-200 dark:border-[#2A2A2A] rounded-lg mb-4">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 dark:bg-[#121212] font-semibold text-slate-700 dark:text-white">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Kode Item</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Item Material</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Quantity</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Satuan</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Status PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Lead Time / Remarks</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-600 dark:text-[#A1A1AA]">
                            <tr>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">ITM-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Semen Portland</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">500</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sak</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sudah PO dan Payment</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">PO-2024-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">2 Hari</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Vendor A</td>
                            </tr>
                            <tr>
                                <td class="p-2">ITM-002</td>
                                <td class="p-2">Besi Beton 12mm</td>
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
                    <li>Kolom <b>Item Material</b>, <b>Quantity</b>, dan <b>Satuan</b> wajib diisi.</li>
                    <li>Sistem dapat mendeteksi variasi nama kolom secara otomatis (misal: <i>Item, Target, Remarks</i>).</li>
                </ul>
                <button onclick="downloadExcelTemplate()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold underline transition-colors"><i class="fas fa-download mr-1"></i> Download Template Excel Kosong</button>
            </div>
        `,showCancelButton:!0,confirmButtonText:'<i class="fas fa-file-upload mr-2"></i> Pilih File',cancelButtonText:"Batal",confirmButtonColor:"#FF7A00",cancelButtonColor:a?"#2A2A2A":"#64748B"}).then(t=>{t.isConfirmed&&document.getElementById("import-excel-file").click()})};window.downloadExcelTemplate=function(){const a=[{No:1,"Kode Item":"ITM-001","Item Material":"Semen Portland",Quantity:500,Satuan:"Sak","Status PO":"Sudah PO dan Payment","No PO":"PO-2024-001","Lead Time / Remarks":"2 Hari",Keterangan:"Vendor A"},{No:2,"Kode Item":"ITM-002","Item Material":"Batu Bata Merah",Quantity:1e4,Satuan:"Pcs","Status PO":"Sudah PO belum Payment","No PO":"PO-2024-002","Lead Time / Remarks":"5 Hari",Keterangan:""},{No:3,"Kode Item":"ITM-003","Item Material":"Pipa PVC 4 Inch",Quantity:150,Satuan:"Batang","Status PO":"Belum PO","No PO":"","Lead Time / Remarks":"Ready Stock",Keterangan:"Gudang Pusat"}],t=XLSX.utils.json_to_sheet(a),e=XLSX.utils.book_new();XLSX.utils.book_append_sheet(e,t,"Template_Material"),XLSX.writeFile(e,"Template_Import_Material.xlsx")};window.handleImportExcel=function(a){const t=a.target.files[0];if(!t)return;const e=document.documentElement.classList.contains("dark"),o=new FileReader;o.onload=async function(r){try{const s=new Uint8Array(r.target.result),d=XLSX.read(s,{type:"array"}),u=d.SheetNames[0],f=d.Sheets[u],m=XLSX.utils.sheet_to_json(f);if(m.length===0)return a.target.value="",Swal.fire({icon:"warning",title:"Data Kosong",text:"File Excel kosong!",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"});let g=new Set;m.forEach(l=>Object.keys(l).forEach(c=>g.add(c))),g=Array.from(g);const L=[{id:"map-code",label:"Kode Item",aliases:["kode","item code","no"]},{id:"map-name",label:"Item Material *",aliases:["nama","item","material","deskripsi"],required:!0},{id:"map-target",label:"Quantity *",aliases:["qty","target","jumlah","volume"],required:!0},{id:"map-unit",label:"Satuan *",aliases:["unit","ukuran"],required:!0},{id:"map-po",label:"Status PO",aliases:["status po","status pembayaran","status"]},{id:"map-pono",label:"No PO",aliases:["no po","nomor po","po number","po"]},{id:"map-lead",label:"Lead Time / Remarks",aliases:["lead time","remarks","waktu"]},{id:"map-desc",label:"Keterangan",aliases:["desc","catatan","vendor"]}];let I=`
                <div class="text-left text-sm text-slate-600 dark:text-[#A1A1AA] mb-4">
                    Sistem membaca kolom yang berbeda. Silakan sesuaikan kolom dari file Excel Anda dengan format sistem di bawah ini:
                </div>
                <div class="space-y-3 text-left">
            `;L.forEach(l=>{let c='<option value="">-- Abaikan / Tidak Ada --</option>',b=!1;g.forEach(p=>{let k=p.toLowerCase(),v=l.label.toLowerCase().replace(" *",""),h=!b&&(k.includes(v)||l.aliases.some(P=>k.includes(P)));h&&(b=!0),c+=`<option value="${p}" ${h?"selected":""}>${p}</option>`}),I+=`
                    <div>
                        <label class="block text-xs font-semibold text-slate-800 dark:text-white mb-1">${l.label}</label>
                        <select id="${l.id}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded p-2 outline-none text-slate-800 dark:text-white text-sm focus:border-[#FF7A00]">
                            ${c}
                        </select>
                    </div>
                `}),I+="</div>";const T=await Swal.fire({title:"Mapping Kolom Excel",html:I,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",showCancelButton:!0,confirmButtonColor:"#FF7A00",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Lanjut Pratinjau",cancelButtonText:"Batal",preConfirm:()=>{const l={};let c=[];return L.forEach(b=>{const p=document.getElementById(b.id).value;b.required&&!p&&c.push(b.label.replace(" *","")),l[b.id]=p}),c.length>0?(Swal.showValidationMessage(`Kolom ${c.join(", ")} wajib dipetakan!`),!1):l}});if(!T.isConfirmed){a.target.value="";return}const n=T.value,A=[];for(const l of m){const c=n["map-code"]?l[n["map-code"]]:"",b=n["map-name"]?l[n["map-name"]]:"",p=n["map-target"]?l[n["map-target"]]:null,k=n["map-unit"]?l[n["map-unit"]]:"",v=n["map-po"]?l[n["map-po"]]:"Belum PO",h=n["map-pono"]?l[n["map-pono"]]:"",P=n["map-lead"]?l[n["map-lead"]]:"",E=n["map-desc"]?l[n["map-desc"]]:"";if(b&&k&&p!==null&&p!==void 0){const $=parseFloat(p);isNaN($)||A.push({projectId:x,itemCode:c?String(c).trim():"",name:String(b).trim(),unit:String(k).trim(),target:$,used:0,poStatus:v?String(v).trim():"Belum PO",poNumber:h?String(h).trim():"",leadTime:P?String(P).trim():"",description:E?String(E).trim():"",timestamp:Date.now()})}}if(A.length===0)return a.target.value="",Swal.fire({icon:"warning",title:"Data Kosong",text:"Tidak ada baris data yang valid berdasarkan pemetaan kolom Anda.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"});let y=`
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA] mb-4 text-left">Ditemukan <b>${A.length}</b> data valid yang siap diimport.</p>
                <div class="max-h-60 overflow-auto text-left text-sm bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-3">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-500 dark:text-[#A1A1AA]">
                                <th class="py-2 text-left w-1/4">Kode</th>
                                <th class="py-2 text-left w-1/2">Item Material</th>
                                <th class="py-2 text-center w-1/4">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
            `;A.slice(0,10).forEach(l=>{y+=`
                    <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-800 dark:text-white last:border-0">
                        <td class="py-2 truncate max-w-[100px]" title="${l.itemCode}">${l.itemCode||"-"}</td>
                        <td class="py-2 truncate max-w-[150px]" title="${l.name}">${l.name}</td>
                        <td class="py-2 text-center">${l.target.toLocaleString("id-ID")} ${l.unit}</td>
                    </tr>
                `}),y+="</tbody></table></div>",A.length>10&&(y+=`<p class="text-xs text-center text-slate-500 dark:text-[#A1A1AA] mt-3 italic">...dan ${A.length-10} baris lainnya.</p>`),Swal.fire({title:"Pratinjau Import",html:y,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",showCancelButton:!0,confirmButtonColor:"#FF7A00",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Ya, Import Sekarang",cancelButtonText:"Batal"}).then(async l=>{if(l.isConfirmed){Swal.fire({title:"Memproses Import...",text:`Mengimport ${A.length} baris material.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()});let c=0;for(const b of A)await j(b),c++;Swal.fire({icon:"success",title:"Import Selesai",text:`Berhasil mengimport ${c} baris data material.`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#FF7A00"}),S()}}).finally(()=>{a.target.value=""})}catch{Swal.fire({icon:"error",title:"Gagal",text:"Format Excel tidak valid.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}),a.target.value=""}},o.readAsArrayBuffer(t)};window.updateMaterialProgress=function(a){const t=w.find(o=>o.id===a);if(!t)return;const e=document.documentElement.classList.contains("dark");Swal.fire({title:`Update Data Material<br><span class="text-sm font-normal text-[#FF7A00]">${t.name}</span>`,background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",html:`
            <div class="text-left mb-4">
                <p class="text-xs text-slate-500 dark:text-[#A1A1AA] mb-1">Target Total: <b>${t.target.toLocaleString("id-ID")} ${t.unit}</b></p>
                <p class="text-xs text-slate-500 dark:text-[#A1A1AA]">Telah Digunakan Saat Ini: <b>${t.used.toLocaleString("id-ID")} ${t.unit}</b></p>
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Total Digunakan Baru</label>
                <input id="swal-m-used" type="number" value="${t.used}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00]">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Status PO</label>
                <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00] cursor-pointer">
                    <option value="Belum PO" ${t.poStatus==="Belum PO"||!t.poStatus?"selected":""}>Belum PO</option>
                    <option value="Sudah PO belum Payment" ${t.poStatus==="Sudah PO belum Payment"?"selected":""}>Sudah PO belum Payment</option>
                    <option value="Sudah PO dan Payment" ${t.poStatus==="Sudah PO dan Payment"?"selected":""}>Sudah PO dan Payment</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Nomor PO</label>
                <input id="swal-m-pono" type="text" value="${t.poNumber||""}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00]" placeholder="Nomor PO (Opsional)">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Lead Time / Remarks</label>
                <input id="swal-m-lead" type="text" value="${t.leadTime||""}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00]">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Keterangan</label>
                <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-[#FF7A00] resize-none" rows="2">${t.description||""}</textarea>
            </div>
        `,showCancelButton:!0,confirmButtonColor:"#FF7A00",cancelButtonColor:e?"#2A2A2A":"#64748B",confirmButtonText:"Update",preConfirm:()=>{const o=parseFloat(document.getElementById("swal-m-used").value),r=document.getElementById("swal-m-po").value,s=document.getElementById("swal-m-pono").value,d=document.getElementById("swal-m-lead").value,u=document.getElementById("swal-m-desc").value;return isNaN(o)||o<0?(Swal.showValidationMessage("Masukkan angka penggunaan yang valid!"),!1):{used:o,poStatus:r,poNumber:s,leadTime:d,description:u}}}).then(async o=>{o.isConfirmed&&(Swal.fire({title:"Mengupdate...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()}),await K(a,{used:o.value.used,poStatus:o.value.poStatus,poNumber:o.value.poNumber,leadTime:o.value.leadTime,description:o.value.description})?(Swal.fire({icon:"success",title:"Terupdate",text:"Data material diperbarui.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b",confirmButtonColor:"#FF7A00"}),S()):Swal.fire({icon:"error",title:"Gagal",text:"Terjadi kesalahan.",background:e?"#1A1A1A":"#ffffff",color:e?"#ffffff":"#1e293b"}))})};window.deleteMaterialItem=function(a){const t=document.documentElement.classList.contains("dark");Swal.fire({title:"Hapus Item Material?",icon:"warning",showCancelButton:!0,confirmButtonColor:"#EF4444",cancelButtonColor:t?"#2A2A2A":"#64748B",confirmButtonText:"Hapus",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b"}).then(async e=>{e.isConfirmed&&(Swal.fire({title:"Menghapus...",allowOutsideClick:!1,didOpen:()=>Swal.showLoading()}),await _(a),Swal.fire({icon:"success",title:"Terhapus",background:t?"#1A1A1A":"#ffffff",color:t?"#ffffff":"#1e293b",confirmButtonColor:"#FF7A00"}),S())})};
