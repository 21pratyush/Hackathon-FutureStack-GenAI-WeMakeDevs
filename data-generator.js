// --- Data Generator App Logic ---

// Default API keys
const DEFAULT_API_KEYS = {
  gemini: "zyz-asd",
  cerebras: "zyz-dsa",
};

// State
let selectedProvider = "cerebras";
let columns = [];
let quantity = 20;
let generatedData = [];

// Templates
const TEMPLATES = [
  {
    name: "Product Catalog",
    tableName: "products",
    columns: [
      { name: "id", description: "Unique product ID" },
      { name: "name", description: "Product name" },
      { name: "price", description: "Numeric value of the product" },
      { name: "category", description: "Category of product" },
      { name: "in_stock", description: "Boolean availability flag" },
    ],
  },
  {
    name: "User Profiles",
    tableName: "users",
    columns: [
      { name: "id", description: "Unique user identifier" },
      { name: "full_name", description: "User’s full name" },
      { name: "email", description: "User’s email address" },
      { name: "age", description: "User’s age" },
      { name: "country", description: "User’s country" },
    ],
  },
  {
    name: "Order Records",
    tableName: "orders",
    columns: [
      { name: "order_id", description: "Unique order number" },
      { name: "user_id", description: "Associated user ID" },
      { name: "total_amount", description: "Total bill amount" },
      { name: "payment_status", description: "Paid / Pending / Failed" },
      { name: "created_at", description: "Order creation timestamp" },
    ],
  },
  {
    name: "Order Records",
    tableName: "orders",
    columns: [
      { name: "order_id", description: "Unique order number" },
      { name: "user_id", description: "Associated user ID" },
      { name: "total_amount", description: "Total bill amount" },
      { name: "payment_status", description: "Paid / Pending / Failed" },
      { name: "created_at", description: "Order creation timestamp" },
    ],
  },
];

// DOM Elements
const providerGemini = document.getElementById("providerGemini");
const providerCerebras = document.getElementById("providerCerebras");
const jsonSchemaBtn = document.getElementById("jsonSchemaBtn");
const columnsList = document.getElementById("columnsList");
const addColumnBtn = document.getElementById("addColumnBtn");
const quantityInput = document.getElementById("quantityInput");
const generateBtn = document.getElementById("generateBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const outputTable = document.getElementById("outputTable");
const outputTableWrapper = document.getElementById("outputTableWrapper");
const emptyDataMsg = document.getElementById("emptyDataMsg");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const templatesContainer = document.querySelector("#templatesContainer");

//styling
const TABLE_STYLE = {
  /* ----------  base classes  ---------- */
  wrapper: "overflow-x-auto overflow-y-auto w-full h-full",
  table: "min-w-full text-sm border-separate border-spacing-0 table-anim",
  header: "sticky top-0 z-10 bg-gray-100",
  cell: "px-2 py-1 text-center border border-gray-200 bg-white",
  index:
    "sticky left-0 z-20 w-12 font-mono text-gray-400 bg-gray-50 border-l border-r border-t border-gray-300",

  /* ----------  dynamic shadow  ---------- */
  shadowOn:
    "shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15),8px_0_16px_-8px_rgba(0,0,0,0.10)]",
  shadowOff: "",

  /* ----------  micro-elements  ---------- */
  addBtn:
    "bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm micro-anim cursor-pointer",
  editName: "editable-col-name cursor-pointer",
  infoIcon: "ml-2 text-gray-500 hover:text-orange-500",
};

// Render Templates
function renderTemplates() {
  const grid = document.getElementById("templatesGrid");
  grid.innerHTML = "";
  TEMPLATES.forEach((tmpl) => {
    const card = document.createElement("div");
    card.className =
      "bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between micro-anim";
    card.innerHTML = `
      <div>
        <h3 class="text-lg font-semibold mb-3 text-gray-800">${tmpl.name}</h3>
        <p class="text-sm text-gray-500 mb-2 font-mono">Table: ${
          tmpl.tableName
        }</p>
        <ul class="text-sm text-gray-600 mb-4 list-disc pl-5">
          ${tmpl.columns.map((col) => `<li>${col.name}</li>`).join("")}
        </ul>
      </div>
      <button class="use-template-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md font-medium cursor-pointer"
        data-template="${tmpl.name}">
        Use This Template
      </button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".use-template-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const tmplName = e.target.getAttribute("data-template");
      const selected = TEMPLATES.find((t) => t.name === tmplName);
      if (selected) applyTemplate(selected);
    };
  });
}

function toggleExportButtons() {
  const hasData = Array.isArray(generatedData) && generatedData.length > 0;
  const mainExportBtn = document.getElementById("downloadCsvBtn");
  const modalExportBtn = document.getElementById("modalExportBtn");

  if (mainExportBtn) {
    mainExportBtn.style.display = hasData ? "flex" : "none";
  }
  if (modalExportBtn) {
    modalExportBtn.style.display = hasData ? "flex" : "none";
  }
}

function applyTemplate(template) {
  columns = [...template.columns];
  renderColumns();
  renderTable([]);
  toggleExportButtons();
}

// --- Provider Selection ---
function updateProviderUI() {
  providerGemini.classList.remove("border-orange-500");
  providerCerebras.classList.remove("border-orange-500");
  if (selectedProvider === "gemini") {
    providerGemini.classList.add("border-orange-500");
  } else {
    providerCerebras.classList.add("border-orange-500");
  }
}
providerGemini.onclick = () => {
  selectedProvider = "gemini";
  updateProviderUI();
};
providerCerebras.onclick = () => {
  selectedProvider = "cerebras";
  updateProviderUI();
};
updateProviderUI();

// --- Modal Logic ---
function openModal(contentHtml, largeModal = false) {
  // Reset modalContent styles to default before applying new ones
  modalContent.style.width = "";
  modalContent.style.height = "";
  modalContent.style.maxWidth = "";
  modalContent.style.maxHeight = "";
  modalContent.style.borderRadius = "";
  modalContent.style.padding = "";
  // Apply large modal styles only if requested
  if (largeModal) {
    modalContent.style.width = "80vw";
    modalContent.style.height = "80vh";
    modalContent.style.maxWidth = "80vw";
    modalContent.style.maxHeight = "80vh";
    modalContent.style.borderRadius = "0";
    modalContent.style.padding = "0";
  }
  modalContent.innerHTML = contentHtml;
  modalOverlay.classList.remove("hidden");
  modalOverlay.style.background = "rgba(0, 0, 0, 0.85)"; // Reduce opacity for modal overlay
}
function closeModal() {
  modalOverlay.classList.add("hidden");
  modalOverlay.style.background = ""; // Reset overlay background
  toggleExportButtons();
}
modalOverlay.onclick = (e) => {
  if (e.target === modalOverlay) closeModal();
};

// --- API Key Modal ---
function openApiKeyModal(provider) {
  const key = localStorage.getItem(`apiKey_${provider}`) || "";
  openModal(`
    <h2 class=\"text-lg font-bold mb-4\">${
      provider.charAt(0).toUpperCase() + provider.slice(1)
    } API Key</h2>
    <input id=\"apiKeyInputModal\" type=\"password\" class=\"w-full border rounded px-3 py-2 mb-4\" placeholder=\"Paste your API key here\" value=\"${key}\" />
    <div class=\"flex justify-end gap-2\">
      <button class=\"px-4 py-2 rounded bg-gray-100 hover:bg-gray-200\" onclick=\"closeModal()\">Cancel</button>
      <button id=\"saveApiKeyBtn\" class=\"px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600\">Save</button>
    </div>
  `);
  setTimeout(() => {
    document.getElementById("saveApiKeyBtn").onclick = () => {
      const val = document.getElementById("apiKeyInputModal").value.trim();
      localStorage.setItem(`apiKey_${provider}`, val);
      closeModal();
    };
  }, 0);
}
// Attach to new settings icons after DOM loaded
window.addEventListener("DOMContentLoaded", () => {
  const settingsGeminiBtn = document.getElementById("settingsGeminiBtn");
  const settingsCerebrasBtn = document.getElementById("settingsCerebrasBtn");
  if (settingsGeminiBtn)
    settingsGeminiBtn.onclick = (e) => {
      e.stopPropagation();
      openApiKeyModal("gemini");
    };
  if (settingsCerebrasBtn)
    settingsCerebrasBtn.onclick = (e) => {
      e.stopPropagation();
      openApiKeyModal("cerebras");
    };
});

// Modal for table view
document.addEventListener("DOMContentLoaded", function () {
  // Set current year in footer
  const yearElement = document.getElementById("copyrightYear");
  if (yearElement) {
    const currentYear = new Date().getFullYear();
    yearElement.innerHTML = `&copy; ${currentYear} Data-Genie. All rights reserved.`;
  }
  const openTableModalBtn = document.getElementById("openTableModalBtn");
  const outputTable = document.getElementById("outputTable");
  const downloadCsvBtn = document.getElementById("downloadCsvBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalContent = document.getElementById("modalContent");
  openTableModalBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    // Clone table HTML and replace outputTable and addColumnFromTableBtn IDs with modal-specific IDs
    let tableHtml = outputTable.outerHTML
      .replace(/id=\"outputTable\"/g, 'id="outputTableModal"')
      .replace(
        /id=\"addColumnFromTableBtn\"/g,
        'id="addColumnFromTableModalBtn"'
      );
    // Modal header info
    const rowCount = Array.isArray(generatedData) ? generatedData.length : 0;
    const colCount = columns.length;
    const providerLabel =
      selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1);
    openModal(
      `
      <div class='flex flex-col w-full h-full bg-gray-50 rounded-lg shadow-lg'>
        <div class='bg-white sticky top-0 z-20' style='min-height:56px;'>
          <div class='flex items-center border-b border-gray-200 px-2 py-1 bg-gray-50 mt-2'>
            <button class='text-gray-500 hover:text-gray-700 rounded-full p-1 mr-2 cursor-pointer' title='Back' onclick='closeModal()'>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class='font-bold text-md text-gray-800 text-xl'>Genie's Sheet</span>
          </div>
          <div class='flex justify-between flex-wrap items-center px-4 py-2'>
            <div>
            <span class='text-gray-500 font-mono text-sm bg-gray-100 px-2 py-1 rounded modal-row-count'>${rowCount} Data-generated</span>
            </div>
            <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rows3-icon lucide-rows-3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/></svg>
            <input id='modalQuantityInput' type='number' min='1' max='100' value='${quantity}' class='border border-gray-200 micro-anim rounded p-1 w-15 text-center text-sm' />
            <button id="modalGenerateBtn"
                        class="h-8 w-28 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-sm shadow-sm micro-anim cursor-pointer flex items-center justify-center gap-1">
                <!-- spark generate icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles-icon lucide-sparkles"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>
                <span>Generate</span>
                </button>    
            <button id='modalExportBtn' 
                class='bg-gray-100 border border-gray-300 text-gray-700 h-8 px-3 text-sm font-semibold rounded-sm shadow-sm hover:bg-gray-200 micro-anim cursor-pointer flex items-center justify-center gap-1'> 
            <span>Export</span>  
            <svg xmlns="http://www.w3.org/2000/svg" 
                width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                stroke-linejoin="round" class="w-4 h-4 text-gray-600">
                <path d="M14 4.1 12 6"/>
                <path d="m5.1 8-2.9-.8"/>
                <path d="m6 12-1.9 2"/>
                <path d="M7.2 2.2 8 5.1"/>
                <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>
            </svg>
            </button>    
            </div>
          </div>
        </div>
        <div class='overflow-x-auto overflow-y-auto flex-1 w-full h-full bg-white p-0' style='max-height:calc(100vh-120px);'>
          <table id='outputTableModal' class='min-w-full text-sm table-anim' style='border-collapse:separate;border-spacing:0;'>
            <thead class='top-0 z-10 bg-gray-100'>
              <tr>
                <th class='px-2 py-1 font-semibold w-12 border-l border-r border-t border-gray-300 sticky left-0 z-20 modal-index-th'></th>
                ${columns
                  .map(
                    (col, idx) => `
                  <th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'>
                    <span class='editable-col-name cursor-pointer' data-idx='${idx}'>${col.name}</span>
                    <button class='ml-2 text-gray-500 hover:text-orange-500 info-icon' data-idx='${idx}' title='Show description'><svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg></button>
                  </th>
                `
                  )
                  .join("")}
                <th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'>
                <button id='addColumnFromTableModalBtn' 
                            class='bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm micro-anim cursor-pointer flex items-center justify-center gap-1'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wand-sparkles-icon lucide-wand-sparkles"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg> 
                Add Column
                 </button>
                 </th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 100 }, (_, i) => {
                let row = `<tr>`;
                row += `<td class='border border-gray-200 px-2 py-1 text-gray-400 font-mono text-center w-12 sticky left-0 z-20 modal-index-td'>${
                  i + 1
                }</td>`;
                for (const col of columns) {
                  let cell =
                    Array.isArray(generatedData) &&
                    generatedData[i] &&
                    generatedData[i][col.name]
                      ? generatedData[i][col.name]
                      : "";
                  if (col.name.toLowerCase().includes("image") && cell) {
                    row += `<td class='border px-2 py-1 text-center bg-white'><img src='${cell}' alt='img' class='h-8 rounded' /></td>`;
                  } else {
                    row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'>${cell}</td>`;
                  }
                }
                row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'></td>`;
                row += "</tr>";
                return row;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,
      true
    );
    // Attach inline editing event handlers for modal table columns immediately
    setTimeout(function () {
      // Add horizontal scroll shadow for sticky index column in modal
      const modalTableWrapper = modalContent.querySelector(".overflow-x-auto");
      const modalIndexTh = modalContent.querySelector(".modal-index-th");
      if (modalTableWrapper && modalIndexTh) {
        function updateIndexShadow() {
          if (modalTableWrapper.scrollLeft > 0) {
            modalIndexTh.style.boxShadow = "2px 0 8px -2px rgba(0,0,0,0.15)";
            document.querySelectorAll(".modal-index-td").forEach((td) => {
              td.style.boxShadow = "2px 0 8px -2px rgba(0,0,0,0.15)";
            });
          } else {
            modalIndexTh.style.boxShadow = "";
            document.querySelectorAll(".modal-index-td").forEach((td) => {
              td.style.boxShadow = "";
            });
          }
        }
        modalTableWrapper.addEventListener("scroll", updateIndexShadow);
        updateIndexShadow();
      }
      // Modal quantity input logic
      const modalQuantityInput = document.getElementById("modalQuantityInput");
      if (modalQuantityInput) {
        modalQuantityInput.oninput = function () {
          quantity = parseInt(this.value, 10) || 1;
        };
      }
      // Modal generate data button logic
      const modalGenerateBtn = document.getElementById("modalGenerateBtn");
      if (modalGenerateBtn) {
        modalGenerateBtn.onclick = async function () {
          if (columns.length === 0) {
            openModal(
              '<div class="text-center">Add columns before generating data.</div><div class="flex justify-end mt-4"><button class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onclick="closeModal()">Close</button></div>'
            );
            return;
          }
          modalGenerateBtn.disabled = true;
          modalGenerateBtn.textContent = "Generating...";
          try {
            const prompt = USER_PROMPT_TEMPLATE(columns, quantity);
            const apiKey = getApiKey();
            let result;
            if (selectedProvider === "gemini") {
              result = await callGemini(apiKey, prompt);
            } else {
              result = await callCerebras(apiKey, prompt);
            }
            let parsed;
            try {
              parsed = JSON.parse(result);
              generatedData = parsed;
              renderTable(parsed);
              toggleExportButtons();
              // Safely refresh modal table content (avoid copying main table outerHTML)
              const modalTable = document.getElementById("outputTableModal");
              if (modalTable) {
                refreshModalTable(parsed);
                bindModalInlineEditingAndInfo();
              }
              const rowCountSpan = document.querySelector(".modal-row-count");
              if (rowCountSpan) {
                rowCountSpan.textContent = `${generatedData.length} Data`;
              }
            } catch {
              renderTable([]);
              openModal(
                `<div class='text-red-600'>${result}</div><div class='flex justify-end mt-4'><button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button></div>`
              );
            }
          } catch (e) {
            renderTable([]);
            openModal(
              `<div class='text-red-600'>${e.message}</div><div class='flex justify-end mt-4'><button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button></div>`
            );
          } finally {
            modalGenerateBtn.disabled = false;
            modalGenerateBtn.textContent = "Generate";
          }
        };
      }
      // Attach inline editing for modal table columns
      document
        .querySelectorAll("#outputTableModal .editable-col-name")
        .forEach((el) => {
          el.onclick = function (e) {
            const idx = parseInt(this.getAttribute("data-idx"));
            const input = document.createElement("input");
            input.type = "text";
            input.value = columns[idx].name;
            input.className = "w-24 border rounded px-2 py-1 text-center";
            this.replaceWith(input);
            input.focus();
            input.onblur = function () {
              columns[idx].name = input.value.trim() || columns[idx].name;
              renderColumns();
              renderTable(generatedData);
            };
            input.onkeydown = function (ev) {
              if (ev.key === "Enter") {
                input.blur();
              }
            };
          };
        });
      // Export button logic and attach add column event to modal table button
      const modalExportBtn = document.getElementById("modalExportBtn");
      if (modalExportBtn) {
        modalExportBtn.onclick = function () {
          // Show export options modal (80vw/80vh)
          const exportOptions = [
            {
              name: "CSV",
              key: "csv",
              img: "https://img.icons8.com/color/48/000000/csv.png",
            },
            {
              name: "Supabase",
              key: "supabase",
              img: "https://img.icons8.com/color/48/supabase.png",
            },
            {
              name: "MongoDB",
              key: "mongodb",
              img: "https://img.icons8.com/color/48/mongodb.png",
            },
            {
              name: "MySQL",
              key: "mysql",
              img: "https://img.icons8.com/color/48/mysql-logo.png",
            },
            {
              name: "PostgreSQL",
              key: "postgresql",
              img: "https://img.icons8.com/color/48/postgreesql.png",
            },
            {
              name: "Google Sheets",
              key: "googleSheets",
              img: "https://img.icons8.com/color/48/google-sheets.png",
            },
            {
              name: "Convex",
              key: "convex",
              img: "https://raw.githubusercontent.com/convex-dev/convex-brand/main/icons/convex-mark.svg",
            },
            {
              name: "Firebase",
              key: "firebase",
              img: "https://img.icons8.com/color/48/firebase.png",
            },
            {
              name: "DynamoDB",
              key: "dynamodb",
              img: "https://img.icons8.com/color/48/amazon-dynamodb.png",
            },
            {
              name: "PlanetScale",
              key: "planetscale",
              img: "https://avatars.githubusercontent.com/u/65073980?s=200&v=4",
            },
            {
              name: "Neon Database",
              key: "neon",
              img: "https://avatars.githubusercontent.com/u/127862693?s=200&v=4",
            },
            {
              name: "DiceDB",
              key: "dicedb",
              img: "https://avatars.githubusercontent.com/u/166834616?s=200&v=4",
            },
            {
              name: "Airtable",
              key: "airtable",
              img: "https://img.icons8.com/color/48/airtable.png",
            },
            {
              name: "BigQuery",
              key: "bigquery",
              img: "https://img.icons8.com/color/48/google-bigquery.png",
            },
            {
              name: "Snowflake",
              key: "snowflake",
              img: "https://img.icons8.com/color/48/snowflake.png",
            },
          ];

          openModal(
            `
  <div class="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl shadow-xl overflow-hidden">
    
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-5 border-b border-gray-200 shrink-0">
      <h2 class="text-2xl font-bold text-gray-800 tracking-tight">Export Data</h2>
      <button onclick="closeModal()" 
        class="text-gray-500 hover:text-gray-700 transition-colors rounded-full p-2 hover:bg-gray-100"
        title="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-10 py-8 space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        ${exportOptions
          .map(
            (opt) => `
          <div class="group bg-white border border-gray-200 rounded-md p-3 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <img src="${opt.img}" alt="${opt.name}" class="h-10 w-10 mb-3 object-contain" />
            <h3 class="font-semibold text-gray-800 text-lg mb-1">${opt.name}</h3>
            <p class="text-gray-400 text-xs mb-4 text-center">Export your data in ${opt.name}</p>
            <button 
              class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 export-btn"
              data-key="${opt.key}">
              Export
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </div>
`,
            true
          );

          // Attach export logic to cards
          setTimeout(() => {
            document.querySelectorAll(".export-card").forEach((card) => {
              const key = card.getAttribute("data-key");
              card.querySelector(".export-btn").onclick = function (e) {
                e.stopPropagation();
                if (key === "csv") {
                  downloadCsvBtn.click();
                } else {
                  // Show coming soon info
                  openModal(`
                    <div class='flex flex-col items-center justify-center p-8'>
                      <img src='${
                        exportOptions.find((opt) => opt.key === key).img
                      }' alt='${
                    exportOptions.find((opt) => opt.key === key).name
                  }' class='h-16 w-16 mb-4 object-contain' />
                      <h2 class='text-xl font-bold mb-2'>${
                        exportOptions.find((opt) => opt.key === key).name
                      } Export</h2>
                      <p class='text-gray-500 mb-6'>Integration coming soon!</p>
                      <button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button>
                    </div>
                  `);
                }
              };
            });
          }, 0);
        };
      }
      // Attach add column event to modal table button (now with unique ID)
      const modalAddBtn = document.getElementById("addColumnFromTableModalBtn");
      if (modalAddBtn && !modalAddBtn.dataset.bound) {
        modalAddBtn.dataset.bound = "1";
        modalAddBtn.addEventListener("click", function () {
          addColumnAndUpdate(true);
        });
      }
    }, 0);
  });
  renderTemplates();
});

// Only orange border for selected provider, default Cerebras
function updateProviderBorders() {
  const gemini = document.getElementById("providerGemini");
  const cerebras = document.getElementById("providerCerebras");
  gemini.style.borderColor = "transparent";
  cerebras.style.borderColor = "transparent";
  if (window.selectedProvider === "gemini") {
    gemini.style.borderColor = "#f97316"; // orange-500
  } else {
    cerebras.style.borderColor = "#f97316";
  }
}

// Rebuilds the modal table inner HTML using modal-specific classes and provided data
function refreshModalTable(data) {
  const cols = columns.map((col) => col.name);
  const table = document.getElementById("outputTableModal");
  if (!table) return;
  let thead = "<thead class='top-0 z-10 bg-gray-100'><tr>";
  thead +=
    "<th class='px-2 py-1 font-semibold w-12 border-l border-r border-t border-gray-300 sticky left-0 z-20 modal-index-th'></th>";
  thead += cols
    .map(
      (col, idx) =>
        `<th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'>` +
        `<span class='editable-col-name cursor-pointer' data-idx='${idx}'>${col}</span>` +
        `<button class='ml-2 text-gray-500 hover:text-orange-500 info-icon' data-idx='${idx}' title='Show description'><svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg></button>` +
        `</th>`
    )
    .join("");
  thead += `<th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'><button id='addColumnFromTableModalBtn' class='bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm micro-anim cursor-pointer'>Add Column</button></th>`;
  thead += "</tr></thead>";

  let tbody = "<tbody>";
  for (let i = 0; i < 100; i++) {
    let row = `<tr>`;
    row += `<td class='border border-gray-200 px-2 py-1 text-gray-400 font-mono text-center w-12 sticky left-0 z-20 modal-index-td'>${
      i + 1
    }</td>`;
    for (const col of cols) {
      const cell =
        Array.isArray(data) && data[i] && data[i][col] ? data[i][col] : "";
      if (col.toLowerCase().includes("image") && cell) {
        row += `<td class='border px-2 py-1 text-center bg-white'><img src='${cell}' alt='img' class='h-8 rounded' /></td>`;
      } else {
        row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'>${cell}</td>`;
      }
    }
    row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'></td>`;
    row += `</tr>`;
    tbody += row;
  }
  tbody += "</tbody>";
  table.innerHTML = thead + tbody;
  toggleExportButtons();
}
window.selectedProvider = "cerebras";
updateProviderBorders();
document.getElementById("providerGemini").onclick = function () {
  window.selectedProvider = "gemini";
  updateProviderBorders();
};
document.getElementById("providerCerebras").onclick = function () {
  window.selectedProvider = "cerebras";
  updateProviderBorders();
};

// --- JSON Schema Modal ---
jsonSchemaBtn.onclick = () => {
  const schema = columns.map((col) => ({
    name: col.name,
    description: col.description,
  }));
  openModal(`
    <h2 class=\"text-lg font-bold mb-4\">Edit JSON Schema</h2>
      <textarea id=\"jsonSchemaEdit\" class=\"w-full h-40 border rounded-xl p-2 font-mono text-sm bg-gray-100 focus:ring-2 focus:ring-orange-400 transition\">${JSON.stringify(
        schema,
        null,
        2
      )}</textarea>
    <div class=\"flex justify-end gap-2 mt-4\">
      <button class=\"px-4 py-2 rounded bg-gray-100 hover:bg-gray-200\" onclick=\"closeModal()\">Cancel</button>
      <button id=\"saveJsonSchemaBtn\" class=\"px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600\">Save</button>
    </div>
  `);
  setTimeout(() => {
    document.getElementById("saveJsonSchemaBtn").onclick = () => {
      try {
        const val = document.getElementById("jsonSchemaEdit").value;
        const arr = JSON.parse(val);
        if (Array.isArray(arr)) {
          columns = arr.map((obj) => ({
            name: obj.name,
            description: obj.description,
          }));
          renderColumns();
          renderTable(generatedData);
          closeModal();
        }
      } catch {}
    };
  }, 0);
};

// --- Columns UI ---
function renderColumns() {
  columnsList.innerHTML = "";
  if (columns.length === 0) {
    columnsList.innerHTML =
      '<span class="text-gray-400">No columns added</span>';
    emptyDataMsg.textContent = "Add columns to generate data";
    return;
  }
  columns.forEach((col, idx) => {
    const btn = document.createElement("button");
    btn.className =
      "bg-white text-orange-700 hover:bg-orange-500 text-orange-700 hover:text-white font-semibold px-3 py-1 rounded flex items-center gap-2 cursor-pointer";
    btn.innerHTML = `${col.name}`;
    btn.onclick = () => openColumnModal(idx);
    columnsList.appendChild(btn);
  });
  // Add remove button for each column
  columnsList.querySelectorAll("button").forEach((btn, idx) => {
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      openRemoveColumnModal(idx);
    };
  });
  emptyDataMsg.textContent = columns.length
    ? ""
    : "Add columns to generate data";
}

function openColumnModal(idx) {
  const col = columns[idx];
  openModal(`
    <h2 class="text-lg font-bold mb-4">Edit Column</h2>
    <label class="block font-medium mb-1">Column Name</label>
    <input id="editColName" type="text" class="w-full border rounded px-3 py-2 mb-2" value="${col.name}" />
    <label class="block font-medium mb-1">Description</label>
    <input id="editColDesc" type="text" class="w-full border rounded px-3 py-2 mb-4" value="${col.description}" />
    <div class="flex justify-end gap-2">
      <button class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onclick="closeModal()">Cancel</button>
      <button id="saveColBtn" class="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">Save</button>
    </div>
  `);
  setTimeout(() => {
    document.getElementById("saveColBtn").onclick = () => {
      const name = document.getElementById("editColName").value.trim();
      const desc = document.getElementById("editColDesc").value.trim();
      if (name) {
        columns[idx] = { name, description: desc };
        renderColumns();
        closeModal();
      }
    };
  }, 0);
}

function openRemoveColumnModal(idx) {
  openModal(`
    <h2 class="text-lg font-bold mb-4">Remove Column</h2>
    <p>Are you sure you want to remove <span class="font-semibold">${columns[idx].name}</span>?</p>
    <div class="flex justify-end gap-2 mt-4">
      <button class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onclick="closeModal()">Cancel</button>
      <button id="removeColBtn" class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">Remove</button>
    </div>
  `);
  setTimeout(() => {
    document.getElementById("removeColBtn").onclick = () => {
      columns.splice(idx, 1);
      renderColumns();
      closeModal();
    };
  }, 0);
}

// Helper: add column and update UI. If inModal=true, also update modal table DOM safely.
function addColumnAndUpdate(inModal) {
  const newIdx = columns.length + 1;
  columns.push({ name: `Column_${newIdx}`, description: "Edit description" });
  renderColumns();
  renderTable(generatedData);
  if (inModal) {
    // Update modal table header and body incrementally instead of replacing outerHTML
    const modalTable = document.getElementById("outputTableModal");
    if (modalTable) {
      const thead = modalTable.querySelector("thead tr");
      if (thead) {
        // insert new TH before the last action TH
        const th = document.createElement("th");
        th.className =
          "px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300";
        th.innerHTML = `<span class='editable-col-name cursor-pointer' data-idx='${
          columns.length - 1
        }'>${
          columns[columns.length - 1].name
        }</span><button class='ml-2 text-gray-500 hover:text-orange-500 info-icon' data-idx='${
          columns.length - 1
        }' title='Show description'><svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg></button>`;
        // The last TH is the Add Column button TH; insert before it
        const lastTh = thead.querySelector("th:last-child");
        if (lastTh) thead.insertBefore(th, lastTh);
        else thead.appendChild(th);
      }
      // For body rows, append an empty TD before the last action TD
      modalTable.querySelectorAll("tbody tr").forEach((tr) => {
        const td = document.createElement("td");
        td.className = "border border-gray-200 px-2 py-1 text-center bg-white";
        // insert before last TD
        const lastTd = tr.querySelector("td:last-child");
        if (lastTd) tr.insertBefore(td, lastTd);
        else tr.appendChild(td);
      });
      // re-bind inline editing and info icons within modal scope
      bindModalInlineEditingAndInfo();
      // re-bind modal add button (in case it was newly created)
      const modalAdd = document.getElementById("addColumnFromTableModalBtn");
      if (modalAdd && !modalAdd.dataset.bound) {
        modalAdd.dataset.bound = "1";
        modalAdd.addEventListener("click", function () {
          addColumnAndUpdate(true);
        });
      }
    }
  }
}

// Helper: bind inline editing and info icon handlers only within modalContent
function bindModalInlineEditingAndInfo() {
  const modalRoot = document.getElementById("modalContent");
  if (!modalRoot) return;
  modalRoot.querySelectorAll(".editable-col-name").forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", function (e) {
      const idx = parseInt(this.getAttribute("data-idx"));
      const input = document.createElement("input");
      input.type = "text";
      input.value = columns[idx].name;
      input.className = "w-24 border rounded px-2 py-1 text-center";
      this.replaceWith(input);
      input.focus();
      input.onblur = function () {
        columns[idx].name = input.value.trim() || columns[idx].name;
        renderColumns();
        renderTable(generatedData);
      };
      input.onkeydown = function (ev) {
        if (ev.key === "Enter") {
          input.blur();
        }
      };
    });
  });
  modalRoot.querySelectorAll(".info-icon").forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute("data-idx"));
      modalOverlay.classList.remove("hidden");
      modalContent.innerHTML = `
          <div style='z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.18); border-radius:1rem; background:white; padding:2rem; min-width:320px; max-width:90vw;'>
            <h2 class='text-xl font-bold mb-4'>Column Description</h2>
            <div class='mb-4'>
              <input id='editDescInput' type='text' class='w-full border rounded px-3 py-2 mb-2' value='${columns[idx].description}' />
            </div>
            <div class='flex justify-end gap-2'>
              <button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button>
              <button id='saveDescBtn' class='px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600'>Save</button>
            </div>
          </div>
        `;
      modalOverlay.style.zIndex = "9999";
      setTimeout(() => {
        document.getElementById("saveDescBtn").onclick = () => {
          const val = document.getElementById("editDescInput").value.trim();
          columns[idx].description = val;
          renderColumns();
          renderTable(generatedData);
          closeModal();
          modalOverlay.style.zIndex = "";
        };
      }, 0);
    });
  });
  // bind scroll shadow inside modal wrapper
  const modalTableWrapper = modalContent.querySelector(".overflow-x-auto");
  const modalIndexTh = modalContent.querySelector(".modal-index-th");
  if (modalTableWrapper && modalIndexTh) {
    function updateIndexShadow() {
      const leftShadow =
        modalTableWrapper.scrollLeft > 0
          ? "2px 0 8px -2px rgba(0,0,0,0.15)"
          : "";
      const rightShadow = ""; // no additional right shadow for modal by default
      modalIndexTh.style.boxShadow =
        leftShadow || rightShadow
          ? `${leftShadow}${rightShadow ? `, ${rightShadow}` : ""}`
          : "";
      modalContent.querySelectorAll(".modal-index-td").forEach((td) => {
        td.style.boxShadow =
          leftShadow || rightShadow
            ? `${leftShadow}${rightShadow ? `, ${rightShadow}` : ""}`
            : "";
      });
    }
    if (!modalTableWrapper._indexShadowBound) {
      modalTableWrapper.addEventListener("scroll", updateIndexShadow);
      modalTableWrapper._indexShadowBound = true;
    }
    updateIndexShadow();
  }
}

addColumnBtn.onclick = () => {
  openModal(`
    <h2 class="text-lg font-bold mb-4">Add Column</h2>
    <label class="block font-medium mb-1">Column Name</label>
    <input id="newColName" type="text" class="w-full border rounded px-3 py-2 mb-2" placeholder="e.g., full_name" />
    <label class="block font-medium mb-1">Description</label>
    <input id="newColDesc" type="text" class="w-full border rounded px-3 py-2 mb-4" placeholder="e.g., A realistic first and last name" />
    <div class="flex justify-end gap-2">
      <button class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onclick="closeModal()">Cancel</button>
      <button id="addColBtn" class="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">Add</button>
    </div>
  `);
  setTimeout(() => {
    document.getElementById("addColBtn").onclick = () => {
      const name = document.getElementById("newColName").value.trim();
      const desc = document.getElementById("newColDesc").value.trim();
      if (name) {
        columns.push({ name, description: desc });
        renderColumns();
        closeModal();
      }
    };
  }, 0);
};

// --- Quantity Input ---
quantityInput.oninput = () => {
  quantity = parseInt(quantityInput.value, 10) || 1;
};

// --- Generate Data ---
function USER_PROMPT_TEMPLATE(columnDefinitions, quantity) {
  const schemaString = columnDefinitions
    .map((col) => `"${col.name}": ${col.description}`)
    .join(",\n");
  return `You are a data generator.\n\nGenerate exactly ${quantity} JSON objects inside a JSON array.\nDo not include any text before or after the JSON.\n\nSchema (keys and their rules):\n{\n${schemaString}\n}\n\nRules:\n- Output must be valid JSON.\n- No comments, explanations, or extra text.\n- Keys must match exactly as provided in the schema.\n- Each record must follow the schema faithfully.\n- Generate ${quantity} unique records.\n\nReturn ONLY the JSON array.`;
}

function getApiKey() {
  return (
    localStorage.getItem(`apiKey_${selectedProvider}`) ||
    DEFAULT_API_KEYS[selectedProvider]
  );
}

async function callGemini(apiKey, prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(url + `?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Gemini API error: " + res.status);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No data returned from Gemini");
  return text;
}

async function callCerebras(apiKey, prompt) {
  const url = "https://api.cerebras.ai/v1/chat/completions";
  const body = {
    model: "qwen-3-235b-a22b-instruct-2507",
    stream: false,
    max_tokens: 20000,
    temperature: 0.7,
    top_p: 0.8,
    messages: [{ role: "system", content: prompt }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Cerebras API error: " + res.status);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("No data returned from Cerebras");
  return text;
}

function renderTable(data) {
  const cols = columns.map((col) => col.name);
  if (cols.length === 0) {
    outputTable.innerHTML = "";
    emptyDataMsg.textContent = "Add columns to generate data";
    return;
  }
  emptyDataMsg.textContent = "";
  let thead =
    "<thead class='top-0 z-10'><tr>" +
    `<th class='px-2 py-1 font-semibold w-12 border-l border-r border-t border-gray-300 sticky left-0 z-20 main-index-th bg-gray-100'>#</th>` +
    cols
      .map(
        (col, idx) =>
          `<th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'>` +
          `<span class='editable-col-name cursor-pointer' data-idx='${idx}'>${col}</span>` +
          `<button class='ml-2 text-gray-500 hover:text-orange-500 info-icon' data-idx='${idx}' title='Show description'><svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg></button>` +
          `</th>`
      )
      .join("") +
    `<th class='px-2 py-1 font-semibold text-center border-t border-l border-r border-gray-300'><button id='addColumnFromTableBtn' class='bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm micro-anim cursor-pointer'> 
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wand-sparkles-icon lucide-wand-sparkles"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg> 
    Add Column</button></th>` +
    "</tr></thead>";
  let tbody = "<tbody>";
  for (let i = 0; i < 100; i++) {
    let row = `<tr>`;
    // Index column (sticky for both header and data)
    row += `<td class='border border-gray-200 px-2 py-1 text-gray-400 font-mono text-center w-12 sticky left-0 z-20 main-index-td bg-white'>${
      i + 1
    }</td>`;
    for (const col of cols) {
      let cell =
        Array.isArray(data) && data[i] && data[i][col] ? data[i][col] : "";
      if (col.toLowerCase().includes("image") && cell) {
        row += `<td class='border px-2 py-1 text-center bg-white'><img src='${cell}' alt='img' class='h-8 rounded' /></td>`;
      } else {
        row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'>${cell}</td>`;
      }
    }
    row += `<td class='border border-gray-200 px-2 py-1 text-center bg-white'></td>`;
    row += "</tr>";
    tbody += row;
  }
  tbody += "</tbody>";
  outputTable.innerHTML = thead + tbody;
  // Add horizontal scroll shadow for sticky index column in main table
  setTimeout(() => {
    const mainTableWrapper = outputTableWrapper;
    const mainIndexTh = outputTable.querySelector(".main-index-th");
    if (mainTableWrapper && mainIndexTh) {
      function updateIndexShadow() {
        const leftShadow =
          mainTableWrapper.scrollLeft > 0
            ? "2px 0 8px -2px rgba(0,0,0,0.15)"
            : "";
        const rightShadow = "8px 0 16px -8px rgba(0,0,0,0.10)";
        // Set exact boxShadow so repeated calls don't accumulate strings
        mainIndexTh.style.boxShadow = leftShadow
          ? `${leftShadow}, ${rightShadow}`
          : rightShadow;
        outputTable.querySelectorAll(".main-index-td").forEach((td) => {
          td.style.boxShadow = leftShadow
            ? `${leftShadow}, ${rightShadow}`
            : rightShadow;
        });
      }
      // Remove any previous listener stored on wrapper to avoid duplicates
      if (!mainTableWrapper._indexShadowBound) {
        mainTableWrapper.addEventListener("scroll", updateIndexShadow);
        mainTableWrapper._indexShadowBound = true;
      }
      updateIndexShadow();
    }
    // ...existing code...
    // Main table add column button (use safe binding)
    const addBtn = outputTable.querySelector("#addColumnFromTableBtn");
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = "1";
      addBtn.addEventListener("click", function () {
        addColumnAndUpdate(false);
      });
    }
    // Modal table add column button (use safe binding). Avoid outerHTML replacement.
    const modalAddBtn = document.querySelector(
      "#outputTableModal #addColumnFromTableModalBtn"
    );
    if (modalAddBtn && !modalAddBtn.dataset.bound) {
      modalAddBtn.dataset.bound = "1";
      modalAddBtn.addEventListener("click", function () {
        addColumnAndUpdate(true);
      });
    }
    // Inline editing for column names
    // Only enable inline editing in the table modal
    document
      .querySelectorAll("#outputTableModal .editable-col-name")
      .forEach((el) => {
        el.onclick = function (e) {
          const idx = parseInt(this.getAttribute("data-idx"));
          const input = document.createElement("input");
          input.type = "text";
          input.value = columns[idx].name;
          input.className = "w-24 border rounded px-2 py-1 text-center";
          this.replaceWith(input);
          input.focus();
          input.onblur = function () {
            columns[idx].name = input.value.trim() || columns[idx].name;
            renderColumns();
            renderTable(generatedData);
          };
          input.onkeydown = function (ev) {
            if (ev.key === "Enter") {
              input.blur();
            }
          };
        };
      });
    // Info icon for description modal
    document.querySelectorAll(".info-icon").forEach((el) => {
      el.onclick = function (e) {
        e.stopPropagation();
        const idx = parseInt(this.getAttribute("data-idx"));
        modalOverlay.classList.remove("hidden");
        modalContent.innerHTML = `
          <div style='z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.18); border-radius:1rem; background:white; padding:2rem; min-width:320px; max-width:90vw;'>
            <h2 class='text-xl font-bold mb-4'>Column Description</h2>
            <div class='mb-4'>
              <input id='editDescInput' type='text' class='w-full border rounded px-3 py-2 mb-2' value='${columns[idx].description}' />
            </div>
            <div class='flex justify-end gap-2'>
              <button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button>
              <button id='saveDescBtn' class='px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600'>Save</button>
            </div>
          </div>
        `;
        modalOverlay.style.zIndex = "9999";
        setTimeout(() => {
          document.getElementById("saveDescBtn").onclick = () => {
            const val = document.getElementById("editDescInput").value.trim();
            columns[idx].description = val;
            renderColumns();
            renderTable(generatedData);
            closeModal();
            modalOverlay.style.zIndex = "";
          };
        }, 0);
      };
    });
  }, 0);
  // Attach add column button event for both main table and modal using direct references
  setTimeout(() => {
    // Main table add column button
    const addBtn = outputTable.querySelector("#addColumnFromTableBtn");
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = "1";
      addBtn.addEventListener("click", function () {
        addColumnAndUpdate(false);
      });
    }
    // Modal table add column button
    const modalAddBtn = document.querySelector(
      "#outputTableModal #addColumnFromTableModalBtn"
    );
    if (modalAddBtn && !modalAddBtn.dataset.bound) {
      modalAddBtn.dataset.bound = "1";
      modalAddBtn.addEventListener("click", function () {
        addColumnAndUpdate(true);
      });
    }
    // Inline editing for column names
    // Only enable inline editing in the table modal
    document
      .querySelectorAll("#outputTableModal .editable-col-name")
      .forEach((el) => {
        el.onclick = function (e) {
          const idx = parseInt(this.getAttribute("data-idx"));
          const input = document.createElement("input");
          input.type = "text";
          input.value = columns[idx].name;
          input.className = "w-24 border rounded px-2 py-1 text-center";
          this.replaceWith(input);
          input.focus();
          input.onblur = function () {
            columns[idx].name = input.value.trim() || columns[idx].name;
            renderColumns();
            renderTable(generatedData);
          };
          input.onkeydown = function (ev) {
            if (ev.key === "Enter") {
              input.blur();
            }
          };
        };
      });
    // Info icon for description modal
    document.querySelectorAll(".info-icon").forEach((el) => {
      el.onclick = function (e) {
        e.stopPropagation();
        const idx = parseInt(this.getAttribute("data-idx"));
        modalOverlay.classList.remove("hidden");
        modalContent.innerHTML = `
          <div style='z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.18); border-radius:1rem; background:white; padding:2rem; min-width:320px; max-width:90vw;'>
            <h2 class='text-xl font-bold mb-4'>Column Description</h2>
            <div class='mb-4'>
              <input id='editDescInput' type='text' class='w-full border rounded px-3 py-2 mb-2' value='${columns[idx].description}' />
            </div>
            <div class='flex justify-end gap-2'>
              <button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button>
              <button id='saveDescBtn' class='px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600'>Save</button>
            </div>
          </div>
        `;
        modalOverlay.style.zIndex = "9999";
        setTimeout(() => {
          document.getElementById("saveDescBtn").onclick = () => {
            const val = document.getElementById("editDescInput").value.trim();
            columns[idx].description = val;
            renderColumns();
            renderTable(generatedData);
            closeModal();
            modalOverlay.style.zIndex = "";
          };
        }, 0);
      };
    });
  }, 0);
  toggleExportButtons();
}

// AI Generate Button
generateBtn.onclick = async () => {
  if (columns.length === 0) {
    openModal(
      '<div class="text-center">Add columns before generating data.</div><div class="flex justify-end mt-4"><button class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onclick="closeModal()">Close</button></div>'
    );
    return;
  }
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  try {
    const prompt = USER_PROMPT_TEMPLATE(columns, quantity);
    const apiKey = getApiKey();
    let result;
    if (selectedProvider === "gemini") {
      result = await callGemini(apiKey, prompt);
    } else {
      result = await callCerebras(apiKey, prompt);
    }
    let parsed;
    try {
      parsed = JSON.parse(result);
      generatedData = parsed;
      renderTable(parsed);
    } catch {
      renderTable([]);
      openModal(
        `<div class='text-red-600'>${result}</div><div class='flex justify-end mt-4'><button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button></div>`
      );
    }
  } catch (e) {
    renderTable([]);
    openModal(
      `<div class='text-red-600'>${e.message}</div><div class='flex justify-end mt-4'><button class='px-4 py-2 rounded bg-gray-100 hover:bg-gray-200' onclick='closeModal()'>Close</button></div>`
    );
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
  }
};

// Export CSV Button
downloadCsvBtn.onclick = () => {
  if (!Array.isArray(generatedData) || generatedData.length === 0) return;
  const cols = columns.map((col) => col.name);
  const escape = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  let csv = cols.map(escape).join(",") + "\n";
  for (const row of generatedData) {
    csv += cols.map((col) => escape(row[col] ?? "")).join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "generated_data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- Initial State ---
renderColumns();
renderTable([]);
toggleExportButtons();

// Always sync table columns on change
const origRenderColumns = renderColumns;
renderColumns = function () {
  origRenderColumns.apply(this, arguments);
  renderTable(generatedData);
};
