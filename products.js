/* ShopVerse product catalog */
const SHOP_PRODUCTS = [
  { id: "sh1", name: "Sneakers", category: "shoes", mrp: 2999, price: 1899, rating: 4.3, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shoe/2/q/i/6-9717-6-world-wear-footwear-green-original-imahgnspddfpp7uy.jpeg?q=90", tags: ["trending", "deals"] },
  { id: "sh2", name: "Running Shoes", category: "shoes", mrp: 2199, price: 1299, rating: 4.5, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shoe/q/s/3/-original-imahd2zhfxxny2ng.jpeg?q=90", tags: ["bestseller"] },
  { id: "sh3", name: "Formal Shoes", category: "shoes", mrp: 4499, price: 2999, rating: 4.1, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shoe/m/f/7/9-marshal-9-new-limits-black-original-imagrxg675qbszpk.jpeg?q=90", tags: [] },
  { id: "sh4", name: "Boots", category: "shoes", mrp: 3999, price: 2499, rating: 4.4, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shoe/n/k/6/9-boot-9-0-dicolus-black-original-imahffguthdzyefz.jpeg?q=90", tags: ["trending"] },
  { id: "sh5", name: "Sandals", category: "shoes", mrp: 1499, price: 999, rating: 4.0, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/sandal/s/k/x/9-786-9-asteroid-tan-original-imah5qj8mgzuvrgx.jpeg?q=90", tags: ["deals"] },
  { id: "cl1", name: "Casual Shirt", category: "clothes", mrp: 599, price: 299, rating: 4.2, image: "https://image.hm.com/assets/hm/35/1e/351ebba228d333cfd94f56f6645ab5f6be00418d.jpg?imwidth=2160", tags: ["deals"] },
  { id: "cl2", name: "Formal Shirt", category: "clothes", mrp: 1299, price: 799, rating: 4.3, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shirt/n/o/l/l-infashion-skyblue-l-infashion-original-imahjqu2xvm5cjw6.jpeg?q=90", tags: [] },
  { id: "cl3", name: "Jeans", category: "clothes", mrp: 999, price: 499, rating: 4.6, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/jean/a/i/p/-original-imahfms8xreddcgy.jpeg?q=90", tags: ["bestseller", "trending"] },
  { id: "cl4", name: "T-Shirt", category: "clothes", mrp: 399, price: 199, rating: 4.4, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/t-shirt/l/t/v/l-m-ts-blk-04-thuglife-annnackel-original-imahjqwmvkxpkehg.jpeg?q=90", tags: ["deals"] },
  { id: "cl5", name: "Hoodie", category: "clothes", mrp: 1999, price: 1299, rating: 4.5, image: "https://m.media-amazon.com/images/I/51F1xobGQNL._SX679_.jpg", tags: ["trending"] },
  { id: "el1", name: "Mobile", category: "electronics", mrp: 89999, price: 80000, rating: 4.7, image: "https://www.sathya.store/img/product/FAb9jtNpEjJeGtMP.png", tags: ["bestseller"] },
  { id: "el2", name: "Tablet", category: "electronics", mrp: 32999, price: 25999, rating: 4.4, image: "https://p2-ofp.static.pub//fes/cms/2025/09/12/w7bjseropaufqe949m6xg0fj78315r011708.png?width=400&height=400", tags: ["trending"] },
  { id: "el3", name: "Laptop", category: "electronics", mrp: 89999, price: 74999, rating: 4.6, image: "https://m.media-amazon.com/images/I/41ZReewIIzL._SY300_SX300_QL70_FMwebp_.jpg", tags: ["bestseller"] },
  { id: "el4", name: "Fan", category: "electronics", mrp: 6999, price: 4999, rating: 4.1, image: "https://www.whiteteak.com/media/catalog/product/c/f/cf9-10011_1_.jpg?optimize=medium&fit=bounds&height=&width=", tags: ["deals"] },
  { id: "el5", name: "Air Conditioner", category: "electronics", mrp: 34999, price: 24999, rating: 4.5, image: "https://daikinacsolutionsplaza.com/blog/wp-content/uploads/2023/04/image-6.png", tags: [] },
  { id: "bk1", name: "Science Fiction", category: "books", mrp: 399, price: 199, rating: 4.3, image: "https://m.media-amazon.com/images/I/51HsGhZFWKL._SY445_SX342_QL70_FMwebp_.jpg", tags: [] },
  { id: "bk2", name: "Simon Jimenez", category: "books", mrp: 499, price: 299, rating: 4.8, image: "https://www.scifinow.co.uk/wp-content/uploads/2019/11/image.png", tags: ["bestseller"] },
  { id: "bk3", name: "Rich Dad Poor Dad", category: "books", mrp: 499, price: 299, rating: 4.7, image: "https://m.media-amazon.com/images/I/81bsw6fnUiL._SY522_.jpg", tags: ["trending"] },
  { id: "bk4", name: "Read People Like a Book", category: "books", mrp: 199, price: 99, rating: 4.2, image: "https://m.media-amazon.com/images/I/41uhiQlhomL._SY445_SX342_QL70_FMwebp_.jpg", tags: ["deals"] },
  { id: "bk5", name: "Poor Economics", category: "books", mrp: 399, price: 199, rating: 4.4, image: "https://cdn.penguin.co.in/wp-content/uploads/2025/12/9788184002805-1.jpg", tags: [] },
  { id: "ty1", name: "Robot", category: "toys", mrp: 799, price: 399, rating: 4.1, image: "https://toyloft.in/cdn/shop/files/WhatsAppImage2024-10-01at10.46.31AM.jpg?v=1727760141&width=823", tags: ["deals"] },
  { id: "ty2", name: "Helicopter", category: "toys", mrp: 2499, price: 1599, rating: 4.3, image: "https://5.imimg.com/data5/SELLER/Default/2023/4/299100194/DM/DS/FV/148269514/61ifgif-0xl-sl1500--1000x1000.jpg", tags: [] },
  { id: "ty3", name: "Blocks", category: "toys", mrp: 399, price: 199, rating: 4.5, image: "https://craftdeals.in/wp-content/uploads/2024/06/61D9QeK10WL._AC_SL1500_.jpg", tags: ["bestseller"] },
  { id: "ty4", name: "Pull Back Car", category: "toys", mrp: 29999, price: 22999, rating: 4.0, image: "https://www.patoys.in/cdn/shop/files/PATOYS_Officially_Licensed_Superman_Jeep_-_Thar_898_Battery_Operated_for_Kids.jpg?v=1745133495&width=823", tags: [] },
  { id: "ty5", name: "Track Cars", category: "toys", mrp: 1499, price: 999, rating: 4.2, image: "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/products/pictures/item/free/resize-w:1280/000000000492410363/1eqdILudat-492410363-9.jpg?dpr=1", tags: ["trending"] },
  { id: "fu1", name: "Sofa", category: "furniture", mrp: 18999, price: 12999, rating: 4.4, image: "https://5.imimg.com/data5/SELLER/Default/2023/9/348216306/JT/OR/FU/26676075/wooden-luxury-sofa-set-1000x1000.jpg", tags: ["bestseller"] },
  { id: "fu2", name: "Chair", category: "furniture", mrp: 7999, price: 5499, rating: 4.3, image: "https://www.greensoul.online/cdn/shop/files/r1.jpg?v=1756712404&width=1917", tags: [] },
  { id: "fu3", name: "Dining Table", category: "furniture", mrp: 15999, price: 10999, rating: 4.5, image: "https://www.nismaayadecor.in/cdn/shop/files/nismaaya-mabel-6-seater-oak-dining-table-set-with-chairs_2.png?v=1687586479&width=1800", tags: ["trending"] },
  { id: "fu4", name: "Almirah", category: "furniture", mrp: 16999, price: 11999, rating: 4.2, image: "https://5.imimg.com/data5/SELLER/Default/2024/7/435136631/UZ/OW/YT/61563095/modern-bedroom-wooden-almirah-1000x1000.jpg", tags: [] },
  { id: "fu5", name: "Bed", category: "furniture", mrp: 18999, price: 12999, rating: 4.6, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/bed/m/a/d/king-190-5-white-no-210-82-particle-board-no-50-ff-bs-feberica-original-imah43qkkcu2zjgm.jpeg?q=90", tags: ["deals"] },
  { id: "ex1", name: "Wireless Earbuds", category: "electronics", mrp: 3999, price: 1499, rating: 4.5, image: "https://m.media-amazon.com/images/I/61f3pgHKfqL._SX679_.jpg", tags: ["deals", "trending"] },
  { id: "ex2", name: "Smart Watch", category: "electronics", mrp: 5999, price: 2499, rating: 4.4, image: "https://m.media-amazon.com/images/I/71Swqqe7XAL._SX679_.jpg", tags: ["trending"] },
  { id: "ex3", name: "Sports Shoes Pro", category: "shoes", mrp: 4999, price: 2199, rating: 4.7, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shoe/q/s/3/-original-imahd2zhfxxny2ng.jpeg?q=90", tags: ["bestseller", "deals"] },
  { id: "ex4", name: "Kurta Set", category: "clothes", mrp: 1999, price: 899, rating: 4.3, image: "https://rukminim2.flixcart.com/image/1704/1704/xif0q/shirt/n/o/l/l-infashion-skyblue-l-infashion-original-imahjqu2xvm5cjw6.jpeg?q=90", tags: ["trending"] },
  { id: "ex5", name: "Study Lamp", category: "furniture", mrp: 1299, price: 599, rating: 4.1, image: "https://www.whiteteak.com/media/catalog/product/c/f/cf9-10011_1_.jpg?optimize=medium&fit=bounds&height=&width=", tags: ["deals"] }
];

const CATEGORY_META = [
  { slug: "shoes", label: "Shoes", page: "shoes.html", icon: "https://cdn-icons-png.flaticon.com/512/2589/2589903.png", search: "shoes footwear sneakers" },
  { slug: "clothes", label: "Fashion", page: "clothes.html", icon: "https://cdn-icons-png.flaticon.com/512/892/892458.png", search: "clothes apparel fashion" },
  { slug: "electronics", label: "Electronics", page: "electronics.html", icon: "https://cdn-icons-png.flaticon.com/512/1041/1041373.png", search: "electronics gadgets mobile laptop" },
  { slug: "books", label: "Books", page: "books.html", icon: "https://cdn-icons-png.flaticon.com/512/29/29302.png", search: "books reading" },
  { slug: "toys", label: "Toys", page: "toys.html", icon: "https://cdn-icons-png.flaticon.com/512/3082/3082060.png", search: "toys games kids" },
  { slug: "furniture", label: "Home", page: "Furniture.html", icon: "https://cdn-icons-png.flaticon.com/512/1040/1040230.png", search: "furniture home decor" }
];

const TRENDING_COLLECTIONS = [
  { title: "Deals of the Day", tag: "deals", timer: true },
  { title: "Best Sellers", tag: "bestseller", timer: false },
  { title: "Trending Now", tag: "trending", timer: false },
  { title: "Top Rated for You", tag: null, sort: "rating", timer: false },
  { title: "New Arrivals", tag: null, ids: ["ex1", "ex2", "ex4", "ex5", "cl4"], timer: false }
];

function getProductById(id) {
  return SHOP_PRODUCTS.find((p) => p.id === id);
}

function getProductByName(name) {
  return SHOP_PRODUCTS.find((p) => p.name === name);
}

function getProductsByCategory(category) {
  return SHOP_PRODUCTS.filter((p) => p.category === category);
}

function getProductsByTag(tag) {
  return SHOP_PRODUCTS.filter((p) => p.tags && p.tags.includes(tag));
}

function getTopRated(limit = 8) {
  return [...SHOP_PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

function discountPercent(mrp, price) {
  return Math.round(((mrp - price) / mrp) * 100);
}
