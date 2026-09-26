import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ArrowRight,
  Minus,
  Plus,
  ChevronRight,
  Star,
  SlidersHorizontal,
  Home as HomeIcon,
  Grid2X2,
  LayoutDashboard,
  Package,
  Users,
  Tag,
  BarChart3,
  Box,
  LogOut,
  Check,
  Truck,
  ShieldCheck,
  Bell,
  ChevronDown,
} from "lucide-react";
import { products, categories, seedOrders } from "./data";
import { dictionaries, TranslationKey } from "./i18n";
import { CartItem, Lang, Order, OrderStatus, Product } from "./types";
import { getPaymentProvider } from "./services/payment";
import {
  isNativeApp,
  nativeApp,
  NativeNotificationState,
} from "./services/native";
import { createOrder, customerMe, demoMode, loadOrders } from "./services/platform";
import CustomerPortal from "./CustomerPortal";
import "./uiTranslate";
import "./tenant.css";
type Page =
  | "home"
  | "shop"
  | "product"
  | "cart"
  | "checkout"
  | "wishlist"
  | "account"
  | "admin";
const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(
    lang === "ar" ? "ar-AE" : lang === "he" ? "he-IL" : "en-US",
    { style: "currency", currency: "USD" },
  ).format(n);
function App() {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("nova-lang") as Lang) || "en",
  );
  const [page, setPage] = useState<Page>("home");
  const [selected, setSelected] = useState<Product>(products[0]);
  const [cart, setCart] = useState<CartItem[]>(() =>
    JSON.parse(localStorage.getItem("nova-cart") || "[]"),
  );
  const [wishlist, setWishlist] = useState<number[]>(() =>
    JSON.parse(localStorage.getItem("nova-wishlist") || "[2,8,14]"),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    demoMode
      ? JSON.parse(
          localStorage.getItem("nova-orders") || JSON.stringify(seedOrders),
        )
      : [],
  );
  const [toast, setToast] = useState("");
  const t = (k: TranslationKey) => dictionaries[lang][k] || dictionaries.en[k];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    localStorage.setItem("nova-lang", lang);
  }, [lang]);
  useEffect(
    () => localStorage.setItem("nova-cart", JSON.stringify(cart)),
    [cart],
  );
  useEffect(
    () => localStorage.setItem("nova-wishlist", JSON.stringify(wishlist)),
    [wishlist],
  );
  useEffect(() => {
    if (demoMode) localStorage.setItem("nova-orders", JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    if (!demoMode)
      loadOrders()
        .then(setOrders)
        .catch(() => setToast("Unable to load orders"));
  }, []);
  const go = (p: Page) => {
    setPage(p);
    scrollTo(0, 0);
  };
  const add = (p: Product, qty = 1, color = p.colors[0], size = p.sizes[0]) => {
    setCart((c) => {
      const i = c.findIndex(
        (x) => x.product.id === p.id && x.color === color && x.size === size,
      );
      return i < 0
        ? [...c, { product: p, qty, color, size }]
        : c.map((x, n) => (n === i ? { ...x, qty: x.qty + qty } : x));
    });
    setToast(t("added"));
    setTimeout(() => setToast(""), 2200);
  };
  const openProduct = (p: Product) => {
    setSelected(p);
    go("product");
  };
  const props = { lang, t, go, cart, wishlist, setWishlist, add, openProduct };
  return (
    <>
      <Header {...props} />
      {page === "home" && <Home {...props} />}{" "}
      {page === "shop" && <Shop {...props} />}{" "}
      {page === "product" && <ProductPage {...props} product={selected} />}{" "}
      {page === "cart" && <Cart {...props} setCart={setCart} />}{" "}
      {page === "checkout" && (
        <Checkout
          {...props}
          setCart={setCart}
          orders={orders}
          setOrders={setOrders}
        />
      )}{" "}
      {page === "wishlist" && <Wishlist {...props} />}{" "}
      {page === "account" && <Account {...props} orders={orders} />}{" "}
      {page === "admin" && (
        <Admin {...props} orders={orders} setOrders={setOrders} />
      )}
      <MobileNav page={page} go={go} cart={cart} />
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
type Shared = {
  lang: Lang;
  t: (k: TranslationKey) => string;
  go: (p: Page) => void;
  cart: CartItem[];
  wishlist: number[];
  setWishlist: (x: number[] | ((v: number[]) => number[])) => void;
  add: (p: Product, q?: number, c?: string, s?: string) => void;
  openProduct: (p: Product) => void;
};
function Header({ t, go, cart, lang }: Shared) {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const results =
    search.length > 1
      ? products
          .filter((p) =>
            (p.name + p.brand + p.category)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .slice(0, 5)
      : [];
  const change = (l: Lang) => {
    localStorage.setItem("nova-lang", l);
    location.reload();
  };
  const navigate = (p: Page) => {
    setMenuOpen(false);
    go(p);
  };
  return (
    <>
      <div className="announce">
        Complimentary shipping on orders over $150 <span>•</span> 30-day returns
      </div>
      <header>
        <button
          className="icon mobile menuToggle"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
        >
          <Menu />
        </button>
        <button className="logo" onClick={() => go("home")}>
          NOVA<span>MARKET</span>
        </button>
        <nav>
          <button onClick={() => go("home")}>{t("home")}</button>
          <button onClick={() => go("shop")}>{t("shop")}</button>
          <button onClick={() => go("shop")}>{t("newArrivals")}</button>
          <button onClick={() => go("shop")}>{t("sale")}</button>
        </nav>
        <div className="headerSearch">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShow(true)}
            placeholder={t("search")}
          />
          {show && results.length > 0 && (
            <div className="suggestions">
              {results.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => {
                    setShow(false);
                    go("shop");
                  }}
                >
                  <img src={p.image} />
                  <span>
                    {p.name}
                    <small>
                      {p.brand} · {money(p.price, lang)}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="headerActions">
          <div className="langs">
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => change("en")}
            >
              EN
            </button>
            <button
              className={lang === "ar" ? "active" : ""}
              onClick={() => change("ar")}
            >
              العربية
            </button>
            <button
              className={lang === "he" ? "active" : ""}
              onClick={() => change("he")}
            >
              עברית
            </button>
          </div>
          <button onClick={() => go("wishlist")} aria-label={t("wishlist")}>
            <Heart />
          </button>
          <button onClick={() => go("account")} aria-label={t("account")}>
            <User />
          </button>
          <button
            onClick={() => go("cart")}
            className="bag"
            aria-label={t("cart")}
          >
            <ShoppingBag />
            <b>{cart.reduce((a, x) => a + x.qty, 0)}</b>
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className="menuBackdrop" onClick={() => setMenuOpen(false)} />
      )}
      <aside
        className={"mobileDrawer " + (menuOpen ? "open" : "")}
        aria-hidden={!menuOpen}
      >
        <div className="drawerHead">
          <button className="logo" onClick={() => navigate("home")}>
            NOVA<span>MARKET</span>
          </button>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="drawerSearch">
          <Search />
          <input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search.length > 1 && (
          <div className="drawerResults">
            {results.map((x) => (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearch("");
                  go("shop");
                }}
              >
                <img src={x.image} />
                <span>
                  {x.name}
                  <small>{x.brand}</small>
                </span>
              </button>
            ))}
          </div>
        )}
        <nav>
          <button onClick={() => navigate("home")}>
            {t("home")}
            <ChevronRight />
          </button>
          <button onClick={() => navigate("shop")}>
            {t("shop")}
            <ChevronRight />
          </button>
          <button onClick={() => navigate("shop")}>
            {t("categories")}
            <ChevronRight />
          </button>
          <button onClick={() => navigate("shop")}>
            {t("newArrivals")}
            <ChevronRight />
          </button>
          <button onClick={() => navigate("wishlist")}>
            {t("wishlist")}
            <ChevronRight />
          </button>
          <button onClick={() => navigate("account")}>
            {t("account")}
            <ChevronRight />
          </button>
        </nav>
        <div className="drawerLanguages">
          <b>{t("language")}</b>
          <div>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => change("en")}
            >
              English
            </button>
            <button
              className={lang === "ar" ? "active" : ""}
              onClick={() => change("ar")}
            >
              العربية
            </button>
            <button
              className={lang === "he" ? "active" : ""}
              onClick={() => change("he")}
            >
              עברית
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
function Home(p: Shared) {
  return (
    <main>
      <section className="hero">
        <div className="heroCopy">
          <small>{p.t("heroTag")}</small>
          <h1>{p.t("heroTitle")}</h1>
          <p>{p.t("heroText")}</p>
          <button className="primary" onClick={() => p.go("shop")}>
            {p.t("shopNow")}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="heroImage" />
      </section>
      <section className="section">
        <Title title={p.t("explore")} action={p.t("viewAll")} />
        <div className="categoryGrid">
          {categories.map((c) => (
            <button key={c.name} onClick={() => p.go("shop")}>
              <img src={c.image} />
              <span>
                {c.name}
                <ChevronRight />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="section cream">
        <Title
          title={p.t("featured")}
          sub={p.t("featuredSub")}
          action={p.t("viewAll")}
        />
        <div className="productGrid">
          {products.slice(0, 8).map((x) => (
            <ProductCard key={x.id} p={x} {...p} />
          ))}
        </div>
      </section>
      <section className="splitPromo">
        <div>
          <small>THE EDIT · 2026</small>
          <h2>{p.t("sale")}</h2>
          <p>{p.t("saleText")}</p>
          <button onClick={() => p.go("shop")} className="lightButton">
            {p.t("shopNow")}
          </button>
        </div>
        <img src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85" />
      </section>
      <section className="section">
        <Title title={p.t("newArrivals")} action={p.t("viewAll")} />
        <div className="productGrid">
          {products.slice(12, 20).map((x) => (
            <ProductCard key={x.id} p={x} {...p} />
          ))}
        </div>
      </section>
      <Newsletter t={p.t} />
      <Footer t={p.t} />
    </main>
  );
}
function Title({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: string;
}) {
  return (
    <div className="sectionTitle">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && (
        <button>
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
function ProductCard({
  p,
  lang,
  t,
  wishlist,
  setWishlist,
  add,
  openProduct,
}: Shared & { p: Product }) {
  const liked = wishlist.includes(p.id);
  return (
    <article className="productCard">
      <div className="productImage">
        <button
          className={"heart " + (liked ? "liked" : "")}
          onClick={() =>
            setWishlist((w) =>
              liked ? w.filter((id) => id !== p.id) : [...w, p.id],
            )
          }
        >
          <Heart fill={liked ? "currentColor" : "none"} />
        </button>
        {p.badge && <span className="badge">{p.badge}</span>}
        <img src={p.image} alt={p.name} onClick={() => openProduct(p)} />
        <button className="quick" onClick={() => add(p)}>
          {t("add")}
        </button>
      </div>
      <button className="productInfo" onClick={() => openProduct(p)}>
        <small>{p.brand}</small>
        <h3>{p.name}</h3>
        <div className="price">
          <b>{money(p.price, lang)}</b>
          {p.oldPrice && <del>{money(p.oldPrice, lang)}</del>}
          <span>
            <Star fill="currentColor" /> {p.rating.toFixed(1)}
          </span>
        </div>
      </button>
    </article>
  );
}
function Shop(p: Shared) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [max, setMax] = useState(500);
  const list = useMemo(
    () =>
      products
        .filter(
          (x) =>
            (cat === "All" || x.category === cat) &&
            x.price <= max &&
            (x.name + x.brand).toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : b.rating - a.rating,
        ),
    [q, cat, sort, max],
  );
  return (
    <main className="shopPage">
      <div className="shopHead">
        <small>DISCOVER THE COLLECTION</small>
        <h1>{p.t("shop")}</h1>
        <p>Design-led essentials for every part of your day.</p>
      </div>
      <div className="catalog">
        <aside>
          <h3>
            <SlidersHorizontal />
            {p.t("filters")}
          </h3>
          <label>
            {p.t("search")}
            <div className="sideSearch">
              <Search />
              <input value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </label>
          <div className="filterGroup">
            <b>{p.t("categories")}</b>
            {["All", ...categories.map((x) => x.name)].map((x) => (
              <button
                className={cat === x ? "active" : ""}
                onClick={() => setCat(x)}
              >
                {x}
                <span>
                  {x === "All"
                    ? products.length
                    : products.filter((p) => p.category === x).length}
                </span>
              </button>
            ))}
          </div>
          <label>
            {p.t("price")} · {money(max, p.lang)}
            <input
              type="range"
              min="50"
              max="500"
              value={max}
              onChange={(e) => setMax(+e.target.value)}
            />
          </label>
          <button
            className="clear"
            onClick={() => {
              setCat("All");
              setQ("");
              setMax(500);
            }}
          >
            {p.t("clear")}
          </button>
        </aside>
        <section className="results">
          <div className="resultsBar">
            <span>
              {list.length} {p.t("results")}
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">{p.t("popular")}</option>
              <option value="low">{p.t("lowHigh")}</option>
              <option value="high">{p.t("highLow")}</option>
            </select>
          </div>
          <div className="productGrid">
            {list.map((x) => (
              <ProductCard key={x.id} p={x} {...p} />
            ))}
          </div>
          {!list.length && (
            <div className="empty">
              <Search />
              <h2>{p.t("noResults")}</h2>
              <button
                onClick={() => {
                  setCat("All");
                  setQ("");
                }}
              >
                {p.t("clear")}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function ProductPage(p: Shared & { product: Product }) {
  const [x, setX] = useState(0);
  const [q, setQ] = useState(1);
  const [color, setColor] = useState(p.product.colors[0]);
  const [size, setSize] = useState(p.product.sizes[0]);
  const liked = p.wishlist.includes(p.product.id);
  return (
    <main>
      <div className="breadcrumbs">
        {p.t("home")} / {p.product.category} / {p.product.name}
      </div>
      <section className="productDetail">
        <div className="gallery">
          <div className="thumbs">
            {[0, 1, 2].map((i) => (
              <button
                className={x === i ? "active" : ""}
                onClick={() => setX(i)}
              >
                <img src={p.product.image} />
              </button>
            ))}
          </div>
          <img
            className="mainPhoto"
            src={p.product.image}
            style={{
              filter:
                x === 1
                  ? "saturate(.7)"
                  : x === 2
                    ? "contrast(.9) brightness(1.08)"
                    : "",
            }}
          />
        </div>
        <div className="detailCopy">
          <small>{p.product.brand}</small>
          <h1>{p.product.name}</h1>
          <div className="reviewLine">
            <span>
              <Star fill="currentColor" /> {p.product.rating.toFixed(1)}
            </span>{" "}
            <u>
              {p.product.reviews} {p.t("reviews")}
            </u>
          </div>
          <div className="detailPrice">
            {money(p.product.price, p.lang)}{" "}
            {p.product.oldPrice && (
              <del>{money(p.product.oldPrice, p.lang)}</del>
            )}
          </div>
          <p>{p.product.description}</p>
          <div className="choice">
            <b>{p.t("color")}</b>
            <div>
              {p.product.colors.map((c) => (
                <button
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={color === c ? "selected" : ""}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="choice size">
            <b>{p.t("size")}</b>
            <div>
              {p.product.sizes.map((s) => (
                <button
                  onClick={() => setSize(s)}
                  className={size === s ? "selected" : ""}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="stock">
            <Check /> {p.t("stock")} · {p.product.stock} available
          </div>
          <div className="addRow">
            <div className="stepper">
              <button onClick={() => setQ(Math.max(1, q - 1))}>
                <Minus />
              </button>
              <span>{q}</span>
              <button onClick={() => setQ(Math.min(p.product.stock, q + 1))}>
                <Plus />
              </button>
            </div>
            <button
              className="primary grow"
              onClick={() => p.add(p.product, q, color, size)}
            >
              {p.t("add")} · {money(p.product.price * q, p.lang)}
            </button>
            <button
              className="wishBig"
              onClick={() =>
                p.setWishlist((w) =>
                  liked
                    ? w.filter((id) => id !== p.product.id)
                    : [...w, p.product.id],
                )
              }
            >
              <Heart fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="assurances">
            <span>
              <Truck />
              Free delivery over $150
            </span>
            <span>
              <ShieldCheck />
              Secure demo checkout
            </span>
          </div>
          <details open>
            <summary>
              {p.t("description")}
              <Plus />
            </summary>
            <p>
              {p.product.description} Responsibly sourced and designed for
              everyday use.
            </p>
          </details>
          <details>
            <summary>
              {p.t("specs")}
              <Plus />
            </summary>
            <p>Premium materials · Easy care · SKU {p.product.sku}</p>
          </details>
        </div>
      </section>
      <section className="section">
        <Title title={p.t("related")} />
        <div className="productGrid">
          {products
            .filter(
              (x) => x.category === p.product.category && x.id !== p.product.id,
            )
            .slice(0, 4)
            .map((x) => (
              <ProductCard key={x.id} p={x} {...p} />
            ))}
        </div>
      </section>
    </main>
  );
}
function Cart(
  p: Shared & {
    setCart: (c: CartItem[] | ((v: CartItem[]) => CartItem[])) => void;
  },
) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const subtotal = p.cart.reduce((a, x) => a + x.product.price * x.qty, 0),
    discount =
      applied === "WELCOME10"
        ? subtotal * 0.1
        : applied === "SAVE20" && subtotal >= 200
          ? Math.min(subtotal * 0.2, 80)
          : 0,
    shipping = applied === "FREESHIP" || subtotal >= 150 ? 0 : 12,
    tax = (subtotal - discount) * 0.08,
    total = subtotal - discount + shipping + tax;
  return (
    <main className="cartPage">
      <h1>
        {p.t("yourBag")}{" "}
        <small>({p.cart.reduce((a, x) => a + x.qty, 0)})</small>
      </h1>
      {!p.cart.length ? (
        <div className="empty">
          <ShoppingBag />
          <h2>{p.t("bagEmpty")}</h2>
          <p>{p.t("bagEmptyText")}</p>
          <button className="primary" onClick={() => p.go("shop")}>
            {p.t("continueShopping")}
          </button>
        </div>
      ) : (
        <div className="cartLayout">
          <section className="cartItems">
            {p.cart.map((x, i) => (
              <article>
                <img src={x.product.image} />
                <div>
                  <small>{x.product.brand}</small>
                  <h3>{x.product.name}</h3>
                  <p>
                    {p.t("color")}: <i style={{ background: x.color }} /> ·{" "}
                    {p.t("size")}: {x.size}
                  </p>
                  <div className="stepper">
                    <button
                      onClick={() =>
                        p.setCart((c) =>
                          c.map((z, n) =>
                            n === i ? { ...z, qty: Math.max(1, z.qty - 1) } : z,
                          ),
                        )
                      }
                    >
                      <Minus />
                    </button>
                    <span>{x.qty}</span>
                    <button
                      onClick={() =>
                        p.setCart((c) =>
                          c.map((z, n) =>
                            n === i ? { ...z, qty: z.qty + 1 } : z,
                          ),
                        )
                      }
                    >
                      <Plus />
                    </button>
                  </div>
                  <button
                    className="textButton"
                    onClick={() =>
                      p.setCart((c) => c.filter((_, n) => n !== i))
                    }
                  >
                    {p.t("remove")}
                  </button>
                </div>
                <b>{money(x.product.price * x.qty, p.lang)}</b>
              </article>
            ))}
          </section>
          <aside className="summary">
            <h2>Order summary</h2>
            <label>
              {p.t("coupon")}
              <div className="coupon">
                <input
                  placeholder={p.t("couponHint")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={() =>
                    setApplied(
                      ["WELCOME10", "SAVE20", "FREESHIP"].includes(code)
                        ? code
                        : "",
                    )
                  }
                >
                  {p.t("apply")}
                </button>
              </div>
            </label>
            {applied && (
              <div className="couponOk">
                <Check /> {applied} applied
              </div>
            )}
            <dl>
              <div>
                <dt>{p.t("subtotal")}</dt>
                <dd>{money(subtotal, p.lang)}</dd>
              </div>
              <div>
                <dt>{p.t("discount")}</dt>
                <dd>-{money(discount, p.lang)}</dd>
              </div>
              <div>
                <dt>{p.t("shipping")}</dt>
                <dd>{shipping ? money(shipping, p.lang) : "FREE"}</dd>
              </div>
              <div>
                <dt>{p.t("tax")}</dt>
                <dd>{money(tax, p.lang)}</dd>
              </div>
              <div className="grand">
                <dt>{p.t("total")}</dt>
                <dd>{money(total, p.lang)}</dd>
              </div>
            </dl>
            <button className="primary wide" onClick={() => p.go("checkout")}>
              {p.t("checkout")}
              <ArrowRight />
            </button>
            <p className="secure">
              <ShieldCheck /> Demo checkout · no real charge
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
function Checkout(
  p: Shared & {
    setCart: (x: CartItem[]) => void;
    orders: Order[];
    setOrders: (x: Order[]) => void;
  },
) {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order>();
  const [form, setForm] = useState({
    name: "Daniel Cohen",
    email: "customer@demo-shop.local",
    phone: "050-555-0182",
    city: "Tel Aviv",
    address: "14 Cedar Lane",
    postal: "64239",
    shipping: "standard",
    cardholder: "Daniel Cohen",
    cardNumber: "",
    expiry: "12/30",
    cvv: "123",
  });
  useEffect(() => {
    if (!demoMode) customerMe().then((customer) => setForm((current) => ({ ...current, name: customer.fullName, email: customer.email, phone: customer.phone || "", cardholder: customer.fullName }))).catch(() => setError("Please log in from Account before placing an order."));
  }, []);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const subtotal = p.cart.reduce((a, x) => a + x.product.price * x.qty, 0),
    shipping = form.shipping === "express" ? 24 : subtotal >= 150 ? 0 : 12,
    total = subtotal + shipping + subtotal * 0.08;
  const pay = async () => {
    setProcessing(true);
    setError("");
    try {
      const id = `DEMO-${1048 + p.orders.length - 2}`;
      const r = demoMode
        ? await getPaymentProvider().processPayment(id, total, form)
        : { success: true, lastFour: "" };
      if (!r.success) { setError(p.t("declined")); return; }
      const saved = !demoMode ? await createOrder({
        email: form.email,
        total,
        address: {
          address: form.address,
          city: form.city,
          postal: form.postal,
        },
        items: p.cart,
      }) : null;
      const o: Order = { id: saved?.order_number || id, date: new Date().toLocaleDateString(), total: saved ? saved.total_minor / 100 : total, status: "Confirmed", items: p.cart, address: `${form.address}, ${form.city}`, lastFour: r.lastFour };
      p.setOrders([o, ...p.orders]);p.setCart([]);setOrder(o);setStep(4);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Order could not be placed");
    } finally { setProcessing(false); }
  };
  if (!p.cart.length && !order)
    return (
      <main className="cartPage">
        <div className="empty">
          <ShoppingBag />
          <h2>{p.t("bagEmpty")}</h2>
          <button className="primary" onClick={() => p.go("shop")}>
            {p.t("continueShopping")}
          </button>
        </div>
      </main>
    );
  return (
    <main className="checkoutPage">
      <button className="checkoutLogo" onClick={() => p.go("home")}>
        NOVA<span>MARKET</span>
      </button>
      <div className="steps">
        {[
          p.t("customerInfo"),
          p.t("delivery"),
          p.t("payment"),
          p.t("confirmation"),
        ].map((x, i) => (
          <div className={step >= i + 1 ? "active" : ""}>
            <span>{step > i + 1 ? <Check /> : i + 1}</span>
            {x}
          </div>
        ))}
      </div>
      {step === 4 && order ? (
        <Confirmation {...p} order={order} />
      ) : (
        <div className="checkoutLayout">
          <section className="checkoutForm">
            {step === 1 && (
              <>
                <h1>{p.t("customerInfo")}</h1>
                <div className="formGrid">
                  {(["name", "email", "phone"] as const).map((k) => (
                    <label className={k === "name" ? "full" : ""}>
                      {p.t(k === "name" ? "fullName" : k)}
                      <input
                        value={form[k]}
                        onChange={(e) => update(k, e.target.value)}
                        required
                      />
                    </label>
                  ))}
                </div>
                <h2>{p.t("delivery")}</h2>
                <div className="formGrid">
                  {(["city", "address", "postal"] as const).map((k) => (
                    <label className={k === "address" ? "full" : ""}>
                      {p.t(k)}
                      <input
                        value={form[k]}
                        onChange={(e) => update(k, e.target.value)}
                        required
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h1>{p.t("delivery")}</h1>
                <button
                  className={
                    "shipChoice " +
                    (form.shipping === "standard" ? "active" : "")
                  }
                  onClick={() => update("shipping", "standard")}
                >
                  <span>
                    <Truck />
                    <b>{p.t("standard")}</b>
                  </span>
                  <b>FREE</b>
                </button>
                <button
                  className={
                    "shipChoice " +
                    (form.shipping === "express" ? "active" : "")
                  }
                  onClick={() => update("shipping", "express")}
                >
                  <span>
                    <Truck />
                    <b>{p.t("express")}</b>
                  </span>
                  <b>{money(24, p.lang)}</b>
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <h1>{p.t("payment")}</h1>
                <div className="demoPanel">
                  <strong>
                    <ShieldCheck /> {p.t("demoPay")}
                  </strong>
                  <p>{p.t("demoWarning")}</p>
                  <div>
                    <button
                      onClick={() =>
                        update("cardNumber", "4242 4242 4242 4242")
                      }
                    >
                      {p.t("successCard")}
                    </button>
                    <button
                      onClick={() =>
                        update("cardNumber", "4000 0000 0000 0002")
                      }
                    >
                      {p.t("declineCard")}
                    </button>
                  </div>
                </div>
                <div className="cardMock">
                  <span>DEMO</span>
                  <b>{form.cardNumber || "•••• •••• •••• ••••"}</b>
                  <small>
                    {form.cardholder || "CARDHOLDER"}　 {form.expiry}
                  </small>
                </div>
                <div className="formGrid">
                  <label className="full">
                    {p.t("cardName")}
                    <input
                      value={form.cardholder}
                      onChange={(e) => update("cardholder", e.target.value)}
                    />
                  </label>
                  <label className="full">
                    {p.t("cardNumber")}
                    <input
                      inputMode="numeric"
                      value={form.cardNumber}
                      onChange={(e) => update("cardNumber", e.target.value)}
                    />
                  </label>
                  <label>
                    {p.t("expiry")}
                    <input
                      value={form.expiry}
                      onChange={(e) => update("expiry", e.target.value)}
                    />
                  </label>
                  <label>
                    {p.t("cvv")}
                    <input
                      value={form.cvv}
                      type="password"
                      maxLength={3}
                      onChange={(e) => update("cvv", e.target.value)}
                    />
                  </label>
                </div>
                {error && <div className="error">{error}</div>}
              </>
            )}
            <div className="checkoutButtons">
              {error && <div className="error" role="alert">{error}</div>}
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}>{p.t("back")}</button>
              )}
              <button
                className="primary"
                disabled={processing}
                onClick={() =>
                  demoMode
                    ? step < 3
                      ? setStep(step + 1)
                      : pay()
                    : step < 2
                      ? setStep(step + 1)
                      : pay()
                }
              >
                {processing
                  ? p.t("processing")
                  : !demoMode && step === 2
                    ? "Place order"
                    : step === 3
                      ? p.t("pay")
                      : p.t("next")}{" "}
                {!processing && <ArrowRight />}
              </button>
            </div>
          </section>
          <aside className="miniSummary">
            <h3>Order summary</h3>
            {p.cart.map((x) => (
              <div>
                <img src={x.product.image} />
                <span>
                  {x.product.name}
                  <small>
                    {x.qty} × {money(x.product.price, p.lang)}
                  </small>
                </span>
                <b>{money(x.product.price * x.qty, p.lang)}</b>
              </div>
            ))}
            <hr />
            <p>
              <span>{p.t("total")}</span>
              <strong>{money(total, p.lang)}</strong>
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
function Confirmation(p: Shared & { order: Order }) {
  return (
    <section className="confirmation">
      <div className="successIcon">
        <Check />
      </div>
      <small>ORDER {p.order.id}</small>
      <h1>{p.t("thankYou")}</h1>
      <p>{p.t("confirmed")}</p>
      <div className="confirmCard">
        <div>
          <span>{p.t("orderNumber")}</span>
          <b>#{p.order.id}</b>
        </div>
        <div>
          <span>{p.t("payment")}</span>
          <b>Demo card ···· {p.order.lastFour}</b>
        </div>
        <div>
          <span>{p.t("delivery")}</span>
          <b>Aug 18–20</b>
        </div>
        <div>
          <span>{p.t("total")}</span>
          <b>{money(p.order.total, p.lang)}</b>
        </div>
      </div>
      <button className="primary" onClick={() => p.go("account")}>
        {p.t("track")}
        <ArrowRight />
      </button>
    </section>
  );
}
function Wishlist(p: Shared) {
  const list = products.filter((x) => p.wishlist.includes(x.id));
  return (
    <main className="cartPage">
      <h1>{p.t("wishlist")}</h1>
      {!list.length ? (
        <div className="empty">
          <Heart />
          <h2>Your wishlist is empty</h2>
          <button className="primary" onClick={() => p.go("shop")}>
            {p.t("continueShopping")}
          </button>
        </div>
      ) : (
        <div className="productGrid">
          {list.map((x) => (
            <ProductCard key={x.id} p={x} {...p} />
          ))}
        </div>
      )}
    </main>
  );
}
function Account(p: Shared & { orders: Order[] }) {
  if (!demoMode) return <CustomerPortal lang={p.lang} />;
  return <DemoAccount {...p} />;
}
function DemoAccount(p: Shared & { orders: Order[] }) {
  const [permission, setPermission] =
    useState<NativeNotificationState>("unsupported");
  useEffect(() => {
    nativeApp.notificationPermission().then(setPermission);
  }, []);
  const enable = async () =>
    setPermission(await nativeApp.requestNotifications());
  return (
    <main className="accountPage">
      <aside>
        <div className="avatar">DC</div>
        <h3>Daniel Cohen</h3>
        <p>customer@demo-shop.local</p>
        {[
          [User, p.t("profile")],
          [Package, p.t("orders")],
          [HomeIcon, p.t("addresses")],
          [Heart, p.t("wishlist")],
        ].map(([I, x]: any) => (
          <button>
            <I />
            {x}
          </button>
        ))}
        {isNativeApp() && (
          <button onClick={enable}>
            <Bell />
            Notifications · {permission === "granted" ? "On" : "Enable"}
          </button>
        )}
        <button onClick={() => p.go("admin")}>
          <LayoutDashboard />
          {p.t("admin")}
        </button>
      </aside>
      <section>
        <div className="accountTitle">
          <div>
            <small>MY ACCOUNT</small>
            <h1>{p.t("orders")}</h1>
          </div>
          {isNativeApp() && (
            <button onClick={enable} aria-label="Enable notifications">
              <Bell />
            </button>
          )}
        </div>
        {isNativeApp() && permission !== "granted" && (
          <div className="nativePermission">
            <Bell />
            <div>
              <b>Never miss an order update</b>
              <p>
                Enable native notifications for shipping and delivery alerts.
              </p>
            </div>
            <button onClick={enable}>Enable</button>
          </div>
        )}
        {p.orders.map((o) => (
          <article className="orderCard">
            <div>
              <span>
                #{o.id}
                <small>{o.date}</small>
              </span>
              <b
                className={
                  "status " + o.status.replaceAll(" ", "").toLowerCase()
                }
              >
                {o.status}
              </b>
            </div>
            <div className="trackline">
              {(
                [
                  "Confirmed",
                  "Preparing",
                  "Shipped",
                  "Out for delivery",
                  "Delivered",
                ] as OrderStatus[]
              ).map((s, i) => {
                const active =
                  i <=
                  [
                    "Confirmed",
                    "Preparing",
                    "Shipped",
                    "Out for delivery",
                    "Delivered",
                  ].indexOf(o.status);
                return (
                  <span className={active ? "active" : ""}>
                    <i>{active ? <Check /> : i + 1}</i>
                    <small>{s}</small>
                  </span>
                );
              })}
            </div>
            <footer>
              <span>{o.address}</span>
              <b>{money(o.total, p.lang)}</b>
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}
function Admin(
  p: Shared & { orders: Order[]; setOrders: (x: Order[]) => void },
) {
  const [section, setSection] = useState("Overview");
  const statuses: OrderStatus[] = [
    "Confirmed",
    "Preparing",
    "Shipped",
    "Out for delivery",
    "Delivered",
  ];
  return (
    <main className="adminPage">
      <aside className="adminSide">
        <button className="logo" onClick={() => p.go("home")}>
          NOVA<span>ADMIN</span>
        </button>
        <nav>
          {[
            [LayoutDashboard, "Overview"],
            [Package, "Orders"],
            [Box, "Products"],
            [Grid2X2, "Inventory"],
            [Users, "Customers"],
            [Tag, "Discounts"],
            [BarChart3, "Reports"],
          ].map(([I, x]: any) => (
            <button
              onClick={() => setSection(x)}
              className={section === x ? "active" : ""}
            >
              <I />
              {p.t(x.toLowerCase() as TranslationKey) || x}
            </button>
          ))}
        </nav>
        <div className="adminUser">
          <div>MA</div>
          <span>
            Maya Admin<small>admin@demo-shop.local</small>
          </span>
          <LogOut />
        </div>
      </aside>
      <section className="adminContent">
        <header>
          <div>
            <small>FRIDAY, AUGUST 14</small>
            <h1>{section === "Overview" ? p.t("welcome") : section}</h1>
            <p>{section === "Overview" && p.t("adminSub")}</p>
          </div>
          <div>
            <button>
              <Search />
            </button>
            <button>
              <Bell />
              <i>3</i>
            </button>
          </div>
        </header>
        {section === "Overview" && (
          <>
            <div className="statGrid">
              {[
                [p.t("todaySales"), "$4,892", "+12.5%"],
                [p.t("monthlyRevenue"), "$84,320", "+8.2%"],
                [p.t("totalOrders"), String(128 + p.orders.length), "+6.4%"],
                [p.t("customers"), "2,847", "+4.1%"],
              ].map(([a, b, c], i) => (
                <article>
                  <span className={`statIcon c${i}`}>
                    <BarChart3 />
                  </span>
                  <small>{a}</small>
                  <h2>{b}</h2>
                  <b>
                    {c} <em>vs last period</em>
                  </b>
                </article>
              ))}
            </div>
            <div className="chartRow">
              <article>
                <div className="chartHead">
                  <span>
                    <h2>{p.t("revenue")}</h2>
                    <small>Last 7 days</small>
                  </span>
                  <select>
                    <option>7 days</option>
                  </select>
                </div>
                <div className="chart">
                  <div className="ylabels">
                    <span>$20k</span>
                    <span>$15k</span>
                    <span>$10k</span>
                    <span>$5k</span>
                    <span>$0</span>
                  </div>
                  {[45, 67, 52, 83, 72, 94, 78].map((h, i) => (
                    <span className="bar" style={{ height: h + "%" }}>
                      <i>${[8, 12, 9, 16, 13, 19, 15][i]}k</i>
                      <small>
                        {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i]}
                      </small>
                    </span>
                  ))}
                </div>
              </article>
              <article className="bestList">
                <h2>Best sellers</h2>
                {products.slice(0, 4).map((x, i) => (
                  <div>
                    <b>0{i + 1}</b>
                    <img src={x.image} />
                    <span>
                      {x.name}
                      <small>{x.stock * 3} sold</small>
                    </span>
                    <strong>{money(x.price * x.stock * 3, p.lang)}</strong>
                  </div>
                ))}
              </article>
            </div>
          </>
        )}
        {(section === "Overview" || section === "Orders") && (
          <article className="orderTable">
            <div className="tableHead">
              <h2>{p.t("recentOrders")}</h2>
              <button>
                View all <ArrowRight />
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{p.t("orderNumber")}</th>
                  <th>{p.t("customers")}</th>
                  <th>{p.t("date")}</th>
                  <th>{p.t("total")}</th>
                  <th>{p.t("payment")}</th>
                  <th>{p.t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {p.orders.map((o, i) => (
                  <tr>
                    <td>
                      <b>#{o.id}</b>
                    </td>
                    <td>{i ? "Daniel Cohen" : "Lina Haddad"}</td>
                    <td>{o.date}</td>
                    <td>{money(o.total, p.lang)}</td>
                    <td>
                      <span className="paid">
                        <Check /> SIMULATED
                      </span>
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) =>
                          p.setOrders(
                            p.orders.map((x) =>
                              x.id === o.id
                                ? {
                                    ...x,
                                    status: e.target.value as OrderStatus,
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        {statuses.map((s) => (
                          <option>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        )}
        {section === "Products" && (
          <div className="orderTable">
            <div className="tableHead">
              <h2>Product catalog</h2>
              <button className="primary">
                <Plus /> Add product
              </button>
            </div>
            <table>
              <tbody>
                {products.slice(0, 12).map((x) => (
                  <tr>
                    <td>
                      <div className="tableProduct">
                        <img src={x.image} />
                        <span>
                          <b>{x.name}</b>
                          <small>{x.sku}</small>
                        </span>
                      </div>
                    </td>
                    <td>{x.category}</td>
                    <td>{money(x.price, p.lang)}</td>
                    <td>
                      <span className={x.stock < 5 ? "low" : ""}>
                        {x.stock} in stock
                      </span>
                    </td>
                    <td>
                      <button>•••</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {section === "Inventory" && (
          <div className="orderTable">
            <div className="tableHead">
              <h2>Inventory</h2>
              <span>6 low stock alerts</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product / variant</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter((x) => x.stock < 25)
                  .map((x) => (
                    <tr>
                      <td>{x.name}</td>
                      <td>{x.sku}</td>
                      <td>{x.stock}</td>
                      <td>
                        <span className={x.stock < 6 ? "low" : "paid"}>
                          {x.stock < 6 ? "Low stock" : "Available"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
function Newsletter({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <section className="newsletter">
      <small>PRIVATE NOTES</small>
      <h2>{t("newsletter")}</h2>
      <p>{t("newsletterText")}</p>
      <div>
        <input placeholder="Email address" />
        <button>
          {t("subscribe")}
          <ArrowRight />
        </button>
      </div>
    </section>
  );
}
function Footer({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <footer className="footer">
      <div>
        <button className="logo">
          NOVA<span>MARKET</span>
        </button>
        <p>{t("footer")}</p>
      </div>
      <div>
        <b>Shop</b>
        <a>New arrivals</a>
        <a>Best sellers</a>
        <a>Gift cards</a>
      </div>
      <div>
        <b>Help</b>
        <a>Shipping</a>
        <a>Returns</a>
        <a>Contact</a>
      </div>
      <div>
        <b>Follow</b>
        <a>Instagram</a>
        <a>Pinterest</a>
        <a>TikTok</a>
      </div>
      <small>© 2026 Nova Market · Demonstration store</small>
    </footer>
  );
}
function MobileNav({
  page,
  go,
  cart,
}: {
  page: Page;
  go: (p: Page) => void;
  cart: CartItem[];
}) {
  return (
    <nav className="mobileNav">
      {[
        [HomeIcon, "home"],
        [Grid2X2, "shop"],
        [Search, "shop"],
        [Heart, "wishlist"],
        [User, "account"],
      ].map(([I, x]: any) => (
        <button className={page === x ? "active" : ""} onClick={() => go(x)}>
          <I />
          {x}
          {x === "shop" && cart.length > 0 ? <i /> : null}
        </button>
      ))}
    </nav>
  );
}
export default App;
