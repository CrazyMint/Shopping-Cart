const API = (() => {
	const URL = "http://localhost:3000";
	const getCart = () => {
		// define your method to get cart data
		return fetch(URL + "/cart")
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	const getInventory = () => {
		// define your method to get inventory data
		return fetch(URL + "/inventory")
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	const addToCart = (inventoryItem) => {
		// define your method to add an item to cart
		return fetch(URL + "/cart", {
			method: "POST",
			body: JSON.stringify(inventoryItem),
			headers: { "Content-Type": "application/json" },
		})
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	const updateCart = (id, newItem) => {
		// define your method to update an item in cart
		return fetch(URL + "/cart/" + id, {
			method: "PATCH",
			body: JSON.stringify(newItem),
			headers: { "Content-Type": "application/json" },
		})
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	// for selected inventory amount update
	const updateInventory = (id, newItem) => {
		// define your method to update an item in inventory
		return fetch(URL + "/inventory/" + id, {
			method: "PATCH",
			body: JSON.stringify(newItem),
			headers: { "Content-Type": "application/json" },
		})
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	const deleteFromCart = (id) => {
		// define your method to delete an item in cart
		return fetch(URL + "/cart/" + id, {
			method: "DELETE",
		})
			.then((data) => data.json())
			.catch((err) => console.log(err));
	};

	const checkout = () => {
		// you don't need to add anything here
		return getCart().then((data) =>
			Promise.all(data.map((item) => deleteFromCart(item.id)))
		);
	};

	return {
		getCart,
		updateCart,
		updateInventory,
		getInventory,
		addToCart,
		deleteFromCart,
		checkout,
	};
})();

const Model = (() => {
	// implement your logic for Model
	class State {
		#onChangeCart;
		#onChangeInventory;
		#inventory;
		#cart;
		constructor() {
			this.#inventory = [];
			this.#cart = [];
		}
		get cart() {
			return this.#cart;
		}

		get inventory() {
			return this.#inventory;
		}

		set cart(newCart) {
			this.#cart = newCart;
			this.#onChangeCart();
		}
		set inventory(newInventory) {
			this.#inventory = newInventory;
			this.#onChangeInventory();
		}

		subscribe(cb1, cb2) {
			this.#onChangeCart = cb1;
			this.#onChangeInventory = cb2;
		}
	}
	const {
		getCart,
		updateCart,
		updateInventory,
		getInventory,
		addToCart,
		deleteFromCart,
		checkout,
	} = API;
	return {
		State,
		getCart,
		updateCart,
		updateInventory,
		getInventory,
		addToCart,
		deleteFromCart,
		checkout,
	};
})();

const View = (() => {
	// implement your logic for View
	const inventoryEl = document.querySelector(".inventory-container ul");
	const cartEl = document.querySelector(".cart-wrapper ul");
	const checkoutBtn = document.querySelector(".checkout-btn");

	const renderInventory = (inventoryItems) => {
		console.log("render inventory");
		let listItems = "";
		inventoryItems.forEach((item) => {
			const curInventoryItem = `<li inventory-id=${item.id}><span>${item.content}</span><button class='minus-btn'>-</button><span>${item.amount}</span><button class='plus-btn'>+</button><button class='add-btn'>add to cart</button></li>`;
			listItems += curInventoryItem;
		});
		inventoryEl.innerHTML = listItems;
	};
	const renderCart = (cartItems) => {
		console.log("render cart");
		let listItems = "";
		cartItems.forEach((item) => {
			const curCartItem = `<li cart-id=${item.id}><span>${item.content} x ${item.amount}</span><button class='delete-btn'>delete</button></li>`;
			listItems += curCartItem;
		});
		cartEl.innerHTML = listItems;
	};
	return {
		inventoryEl,
		cartEl,
		checkoutBtn,
		renderInventory,
		renderCart,
	};
})();

const Controller = ((model, view) => {
	// implement your logic for Controller
	const state = new model.State();

	const init = () => {
		model.getInventory().then((inventory) => {
			state.inventory = inventory;
			view.renderInventory(state.inventory);
		});
		model.getCart().then((cart) => {
			state.cart = cart;
			view.renderCart(state.cart);
		});
	};
	const handleUpdateAmount = () => {
		view.inventoryEl.addEventListener("click", (event) => {
			event.preventDefault();
			if (
				event.target.className !== "plus-btn" &&
				event.target.className !== "minus-btn"
			)
				return;
			const id = event.target.parentNode.getAttribute("inventory-id");
			const inventoryItem = state.inventory.find(
				(element) => element.id === +id
			);
			if (event.target.className === "plus-btn") {
				inventoryItem.amount++;
				console.log("plus amount");
			} else if (event.target.className === "minus-btn") {
				inventoryItem.amount--;
				console.log("minus amount");
			}
			inventoryItem.amount =
				inventoryItem.amount <= 0 ? 0 : inventoryItem.amount;
			// updateInventory -> database
			const inventoryObj = {
				content: inventoryItem.content,
				amount: inventoryItem.amount,
				id,
			};
			model.updateInventory(id, inventoryObj).then((data) => {
				state.inventory = [...state.inventory];
			});
		});
	};

	const alreadyInCart = (content) => {
		return state.cart.some((item) => item.content === content);
	};

	const getAmount = (id) => {
		const cartItem = state.cart.find((item) => item.id === id);
		return cartItem.amount;
	};

	const handleAddToCart = () => {
		view.inventoryEl.addEventListener("click", (event) => {
			event.preventDefault();
			if (event.target.className !== "add-btn") return;
			const id = Number(event.target.parentNode.getAttribute("inventory-id"));
			const inventoryItem = state.inventory.find(
				(element) => element.id === id
			);
			const { amount, content } = inventoryItem;
			if (amount === 0) return;
			let cartObj = { content, amount, id };
			if (!alreadyInCart(content)) {
				model.addToCart(cartObj).then((newCart) => {
					state.cart = [...state.cart, cartObj];
				});
			} else {
				const initialAmount = getAmount(id);
				const newAmount = amount + initialAmount;
				cartObj = { content, amount: newAmount, id };
				model.updateCart(id, cartObj).then((data) => {
					state.cart = state.cart.map((item) => {
						if (item.id === id) {
							item.amount = newAmount;
						}
						return item;
					});
				});
			}
		});
	};

	const handleDelete = () => {
		view.cartEl.addEventListener("click", (event) => {
			event.preventDefault();
			console.log("delete from cart");
			if (event.target.className !== "delete-btn") return;
			const id = Number(event.target.parentNode.getAttribute("cart-id"));
			model.deleteFromCart(id).then(() => {
				state.cart = state.cart.filter((item) => item.id !== id);
			});
		});
	};

	const handleCheckout = () => {
		view.checkoutBtn.addEventListener("click", (event) => {
			event.preventDefault();
			console.log("check out");
			model.checkout().then(() => {
				state.cart = [];
			});
		});
	};

	const bootstrap = () => {
		handleAddToCart();
		handleDelete();
		handleCheckout();
		init();
		handleUpdateAmount();
		state.subscribe(
			() => view.renderCart(state.cart),
			() => view.renderInventory(state.inventory)
		);
	};
	return {
		bootstrap,
	};
})(Model, View);

Controller.bootstrap();
