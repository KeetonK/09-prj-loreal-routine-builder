/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const productSearch = document.getElementById("productSearch");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Store selected products in an array */
let selectedProducts = [];

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

/* Create HTML for displaying product cards with selection */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      // Check if product is selected
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
        <div class="product-card${isSelected ? " selected" : ""}" data-name="${
        product.name
      }">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <div class="product-description" aria-live="polite">${
              product.description || ""
            }</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Add click event listeners to product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.getAttribute("data-name");
      const products = Array.from(productCards).map((c) =>
        c.getAttribute("data-name")
      );
      // Find product by name
      loadProducts().then((allProducts) => {
        const product = allProducts.find((p) => p.name === name);
        if (!product) return;
        // Toggle selection
        const index = selectedProducts.findIndex((p) => p.name === name);
        if (index === -1) {
          selectedProducts.push(product);
        } else {
          selectedProducts.splice(index, 1);
        }
        displayProducts(
          allProducts.filter((p) => p.category === categoryFilter.value)
        );
        updateSelectedProductsList();
      });
    });
  });
}

/* Update the Selected Products section */
function updateSelectedProductsList() {
  const selectedList = document.getElementById("selectedProductsList");
  if (selectedProducts.length === 0) {
    selectedList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    // Hide clear all button if present
    const clearBtn = document.getElementById("clearSelectedBtn");
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }
  selectedList.innerHTML = selectedProducts
    .map(
      (product, idx) => `
        <div class="selected-product-item">
          <img src="${product.image}" alt="${product.name}" />
          <span>${product.name}</span>
          <button class="remove-selected" data-idx="${idx}" title="Remove">&times;</button>
        </div>
      `
    )
    .join("");
  // Add clear all button
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.style.margin = "16px 0 0 0";
    clearBtn.style.padding = "8px 16px";
    clearBtn.style.background = "#e3a535";
    clearBtn.style.color = "#fff";
    clearBtn.style.border = "none";
    clearBtn.style.borderRadius = "6px";
    clearBtn.style.cursor = "pointer";
    clearBtn.onclick = () => {
      selectedProducts = [];
      saveSelectedProducts();
      updateSelectedProductsList();
      loadProducts().then((allProducts) => {
        displayProducts(
          allProducts.filter((p) => p.category === categoryFilter.value)
        );
      });
    };
    selectedList.parentElement.appendChild(clearBtn);
  } else {
    document.getElementById("clearSelectedBtn").style.display = "block";
  }
  // Add remove button listeners
  const removeBtns = document.querySelectorAll(".remove-selected");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.getAttribute("data-idx"));
      selectedProducts.splice(idx, 1);
      saveSelectedProducts();
      updateSelectedProductsList();
      loadProducts().then((allProducts) => {
        displayProducts(
          allProducts.filter((p) => p.category === categoryFilter.value)
        );
      });
    });
  });
  saveSelectedProducts();
}

/* Load product data from JSON file */
let allLoadedProducts = [];
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allLoadedProducts = data.products;
  return data.products;
}

/* Filter products by category and search */
function filterProducts() {
  let filtered = allLoadedProducts;
  const currentCategory = categoryFilter.value;
  if (currentCategory) {
    filtered = filtered.filter((p) => p.category === currentCategory);
  }
  const searchTerm = productSearch.value.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm))
    );
  }
  displayProducts(filtered);
}

/* Listen for category changes */
categoryFilter.addEventListener("change", async (e) => {
  await loadProducts();
  filterProducts();
  updateSelectedProductsList();
});

/* Listen for search input */
productSearch.addEventListener("input", () => {
  filterProducts();
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
  updateSelectedProductsList();
});

// Load selected products from localStorage on page load
loadSelectedProductsFromStorage();
updateSelectedProductsList();

/* Store conversation history for chat */
let messages = [];
let routineGenerated = false;

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* Generate routine using OpenAI API when button is clicked */
const generateBtn = document.getElementById("generateRoutine");

function renderChatHistory() {
  // Only show messages after the initial routine request (skip first user message)
  let filtered = messages.filter(
    (m, i) => m.role !== "system" && !(m.role === "user" && i === 1)
  );
  chatWindow.innerHTML = filtered
    .map((m) => {
      if (m.role === "user") {
        return `<div class='chat-message user'><strong>You:</strong> ${m.content}</div>`;
      } else {
        // Format assistant response
        let formatted = m.content
          .replace(/\n\n/g, "<br><br>")
          .replace(/\n- /g, "<br>&bull; ")
          .replace(/^- /, "&bull; ");
        return `<div class='chat-message assistant'>${formatted}</div>`;
      }
    })
    .join("");
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

const OPENAI_API_URL = "https://lorealworker.ktkauffm.workers.dev";

generateBtn.addEventListener("click", async () => {
  chatWindow.innerHTML = `<div class="placeholder-message">Generating your routine...</div>`;
  const allProducts = await loadProducts();
  const selectedDescriptions = selectedProducts
    .map((p) => `- ${p.name}: ${p.description || ""}`)
    .join("\n");
  messages = [
    {
      role: "system",
      content:
        "You are a helpful beauty routine assistant. Use the provided product data to recommend a routine using only the selected products. Format your response with line breaks and bullet points for clarity. Keep your answer short, friendly, and easy to read for beginners. Only answer questions about the routine or beauty topics like skincare, haircare, makeup, fragrance, etc.",
    },
    {
      role: "user",
      content: `Here are all available products:\n${allProducts
        .map((p) => `- ${p.name}: ${p.description || ""}`)
        .join(
          "\n"
        )}\n\nSelected products:\n${selectedDescriptions}\n\nPlease recommend a routine using only the selected products.`,
    },
  ];
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 250,
      }),
    });
    const data = await response.json();
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      messages.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      routineGenerated = true;
      renderChatHistory();
    } else {
      chatWindow.innerHTML = `<div class='placeholder-message'>Sorry, no response from AI.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class='placeholder-message'>Error: ${error.message}</div>`;
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!routineGenerated) {
    chatWindow.innerHTML = `<div class='placeholder-message'>Please generate a routine first.</div>`;
    return;
  }
  if (!userInput) return;
  messages.push({ role: "user", content: userInput });
  renderChatHistory();
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 200,
      }),
    });
    const data = await response.json();
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      messages.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML += `<div class='placeholder-message'>Sorry, no response from AI.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div class='placeholder-message'>Error: ${error.message}</div>`;
  }
});

// Initial load
loadProducts().then(() => {
  filterProducts();
  updateSelectedProductsList();
});
