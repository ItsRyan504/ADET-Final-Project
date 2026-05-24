import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

/* ─── All items as one flat ring — carousel never "resets" ─── */
const ALL_ITEMS = [
  /* ── Coffee ── */
  { id: 'c1', name: 'Caramel Macchiato', desc: 'Espresso poured over velvety steamed milk with a swirl of rich caramel — a sweet, indulgent classic you can count on.', img: 'http://localhost/salespresso-api/uploads/32180482833017a1121737c00cee1ef1.png', tag: 'Best Seller', cat: 0 },
  { id: 'c2', name: 'Cappuccino',         desc: 'A perfect balance of bold espresso, steamed milk, and a thick layer of airy foam — the timeless Italian classic.', img: 'http://localhost/salespresso-api/uploads/c7beb4a3d36e4a4a0643d4f5a23dd33f.png', tag: null, cat: 0 },
  { id: 'c3', name: 'Mocha',              desc: 'Rich espresso meets velvety chocolate and steamed milk — a smooth, soul-warming cup for chocolate lovers.', img: 'http://localhost/salespresso-api/uploads/6fec329848023d9115edf94b437bae65.png', tag: null, cat: 0 },
  /* ── Milk Tea ── */
  { id: 'm1', name: 'Brown Sugar Milk Tea', desc: 'Creamy milk tea swirled with house-made brown sugar syrup — sweet, bold, and impossible to put down.', img: 'http://localhost/salespresso-api/uploads/8249b3e626b5c506694cee7ae5fd3843.png', tag: 'Popular', cat: 1 },
  { id: 'm2', name: 'Taro Milk Tea',        desc: "Smooth, earthy taro blended with creamy milk tea — a naturally sweet indulgence you'll keep coming back to.", img: 'http://localhost/salespresso-api/uploads/df94de0e21bb330233b5a6447fe267ae.png', tag: null, cat: 1 },
  { id: 'm3', name: 'Wintermelon Milk Tea', desc: 'A light wintermelon infusion paired with silky milk tea — refreshing, subtly sweet, and perfectly balanced.', img: 'http://localhost/salespresso-api/uploads/25d501e0a839c965eb0c2cdceeef3cc9.png', tag: null, cat: 1 },
  /* ── Sides ── */
  { id: 's1', name: 'Cheese Fries',    desc: 'Golden crispy fries smothered in warm, melted cheese sauce — the ultimate crowd-pleasing snack to share.', img: 'http://localhost/salespresso-api/uploads/fd89a5e3c5f100d31f54ea018042d2ed.webp', tag: 'Fan Favorite', cat: 2 },
  { id: 's2', name: 'Club Sandwich',   desc: 'Layers of fresh ingredients stacked between toasted bread — a hearty, satisfying bite for any time of day.', img: 'http://localhost/salespresso-api/uploads/e5a2f70cb5d1f4f385ed54a4f516425b.png', tag: null, cat: 2 },
  { id: 's3', name: 'Nachos',          desc: 'Crunchy tortilla chips loaded with cheese, jalapeños, and zesty toppings — snacking perfection in every handful.', img: 'http://localhost/salespresso-api/uploads/5373f5533d61dfe4041d0c0e1f02f8ea.png', tag: null, cat: 2 },
];

const TOTAL = ALL_ITEMS.length;
const TABS  = ['Coffee', 'Milk Tea', 'Sides'];

/* Items to render: center ± 2 neighbors (wrapping), keyed by real index */
function wrap(i) { return ((i % TOTAL) + TOTAL) % TOTAL; }

const TESTIMONIALS = [
  { id: 1, text: 'The coffee is consistently good, the place feels warm and inviting, perfect for both quiet moments and catching up with friends. You can really feel the care they put into every cup.', name: 'Sawako Kuronuma', role: 'Verified Customer', img: '/customer_avatar.png', stars: 5 },
  { id: 2, text: 'The coffee is consistently good, the place feels warm and inviting, perfect for both quiet moments and catching up with friends. You can really feel the care they put into every cup.', name: 'Sawako Kuronuma', role: 'Verified Customer', img: '/customer_avatar.png', stars: 5 },
  { id: 3, text: 'The coffee is consistently good, the place feels warm and inviting, perfect for both quiet moments and catching up with friends. You can really feel the care they put into every cup.', name: 'Sawako Kuronuma', role: 'Verified Customer', img: '/customer_avatar.png', stars: 5 },
];

const PLACE_ID = 'ChIJvQyNOAADoTMRddAjPHvdwv4';

export default function Home() {
  /* `center` is the real index (0-8) of the center card */
  const [center, setCenter] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gmapsRating, setGmapsRating] = useState({ rating: null, total: null });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
      headers: {
        'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
      },
    })
      .then(r => r.json())
      .then(data => {
        if (data.rating !== undefined) {
          setGmapsRating({ rating: data.rating, total: data.userRatingCount });
        }
        if (Array.isArray(data.reviews)) {
          const top3 = data.reviews
            .filter(r => r.text?.text)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
          setReviews(top3);
        }
      })
      .catch(() => {});
  }, []);

  /* Active tab reflects the category of the center item */
  const activeCat = ALL_ITEMS[center].cat;

  /* Auto-advance every 4 s */
  const advance = useCallback(() => {
    setCenter(prev => wrap(prev + 1));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(advance, 4000);
    return () => clearInterval(id);
  }, [advance, isPaused]);

  /* Manual nav */
  function goTo(idx) { setCenter(wrap(idx)); }

  /* Clicking a tab jumps to the first item of that category */
  function jumpToCategory(catIdx) {
    const firstInCat = ALL_ITEMS.findIndex(it => it.cat === catIdx);
    setCenter(firstInCat);
  }

  /* Position class for a given real index */
  function cardClass(realIdx) {
    const diff = ((realIdx - center) % TOTAL + TOTAL) % TOTAL;
    // treat diff > TOTAL/2 as negative (left side)
    const signed = diff > TOTAL / 2 ? diff - TOTAL : diff;
    if (signed === 0)  return 'carousel__card--center';
    if (signed === -1) return 'carousel__card--left';
    if (signed === 1)  return 'carousel__card--right';
    if (signed <= -2)  return 'carousel__card--hidden-left';
    return 'carousel__card--hidden-right';
  }

  /* Render center ± 2 so off-screen neighbors can animate in/out */
  const visibleIndices = [-2, -1, 0, 1, 2].map(offset => wrap(center + offset));

  /* Touch swipe */
  const touchStartX = useRef(null);
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? goTo(center + 1) : goTo(center - 1);
    touchStartX.current = null;
  }

  return (
    <main className="home">
      {/* ────────── HERO ────────── */}
      <section className="hero">
        <video
          className="hero__bg-video"
          autoPlay
          muted
          loop
          playsInline
          onTimeUpdate={e => { if (e.target.currentTime >= 29) e.target.currentTime = 0; }}
        >
          <source src="/Kávé összefoglaló - marketing videó.mp4" type="video/mp4" />
        </video>
        <div className="hero__overlay" />
        <div className="hero__centered">
          <p className="hero__eyebrow-text">This is Jazsam Coffee</p>
          <h1 className="hero__headline">Where every sip tells a tale.</h1>
        </div>
        <div className="hero__social-handle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>@JazsamCoffee</span>
        </div>
      </section>

      {/* ────────── FEATURED CAROUSEL ────────── */}
      <section className="featured section-pad">
        <div className="container">
          <div className="featured__header">
            <div>
              <p className="section-eyebrow">Featured</p>
              <p className="section-subtitle">Discover our top picks—customer favorites brewed to perfection and loved in every sip.</p>
            </div>
            <Link to="/menu" className="featured__view-link">View Full Menu →</Link>
          </div>

          <div
            className="carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="carousel__track">
              {visibleIndices.map(realIdx => {
                const item = ALL_ITEMS[realIdx];
                const pos  = cardClass(realIdx);
                const isCenter = pos === 'carousel__card--center';
                return (
                  <div
                    key={item.id}
                    className={`carousel__card ${pos}`}
                    onClick={() => goTo(realIdx)}
                  >
                    {item.tag && <span className="featured__card-tag">{item.tag}</span>}
                    <div className="carousel__card-img-wrap">
                      <img src={item.img} alt={item.name} className="carousel__card-img" />
                    </div>
                    <div className="carousel__card-body">
                      <h3 className="carousel__card-name">{item.name}</h3>
                      <p className="carousel__card-desc">{item.desc}</p>
                      {isCenter && (
                        <Link to="/menu" className="btn-primary carousel__card-btn">GET BREWING</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrows */}
            <button className="carousel__arrow carousel__arrow--left" onClick={() => goTo(center - 1)} aria-label="Previous">‹</button>
            <button className="carousel__arrow carousel__arrow--right" onClick={() => goTo(center + 1)} aria-label="Next">›</button>

            {/* Dots — one per item in current category */}
            <div className="carousel__dots">
              {ALL_ITEMS.filter(it => it.cat === activeCat).map((it, localIdx) => {
                const realIdx = ALL_ITEMS.indexOf(it);
                return (
                  <button
                    key={it.id}
                    className={`carousel__dot${center === realIdx ? ' carousel__dot--active' : ''}`}
                    onClick={() => goTo(realIdx)}
                    aria-label={`Go to ${it.name}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Tabs — clicking jumps to first item of that category */}
          <div className="featured__tabs">
            {TABS.map((tab, ci) => (
              <button
                key={tab}
                className={`featured__tab${activeCat === ci ? ' featured__tab--active' : ''}`}
                onClick={() => jumpToCategory(ci)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── TESTIMONIALS ────────── */}
      <section className="testimonials section-pad">
        <div className="container">
          <div className="testimonials__top">
            <div className="testimonials__quote-wrap">
              <div className="testimonials__big-quote">"</div>
              <h2 className="testimonials__headline">Read words<br />from our<br />customers.</h2>
            </div>
            <div className="testimonials__cards">
              {(reviews.length > 0 ? reviews : TESTIMONIALS).map((t, i) => {
                const isGmaps = 'authorAttribution' in t;
                const name    = isGmaps ? t.authorAttribution.displayName : t.name;
                const photo   = isGmaps ? t.authorAttribution.photoUri    : t.img;
                const text    = isGmaps ? t.text?.text                    : t.text;
                const stars   = isGmaps ? t.rating                        : t.stars;
                const role    = isGmaps ? t.relativePublishTimeDescription : t.role;
                return (
                  <div key={i} className="testimonial__card">
                    <p className="testimonial__text">{text}</p>
                    <div className="testimonial__footer">
                      <img src={photo} alt={name} className="testimonial__avatar" referrerPolicy="no-referrer" />
                      <div>
                        <div className="testimonial__name">{name}</div>
                        <div className="testimonial__role">{role}</div>
                      </div>
                      <div className="star-row" style={{ marginLeft: 'auto' }}>
                        {Array.from({ length: stars }).map((_, si) => <span key={si}>★</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ────────── MAP ────────── */}
      <section className="map-section section-pad">
        <div className="container">
          <div className="map-section__inner">
            <div className="map-section__info">
              <h2 className="map-section__title">Find us on the Map</h2>
              <p className="map-section__sub">Drop by for pickups and in-person inquiries.</p>
              <div className="map-section__details">
                <div className="map-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div><strong>Address:</strong><br />4PLJ+32W, Old Albay District,<br /> Legazpi City, Albay</div>
                </div>
                <div className="map-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div><strong>Hours:</strong><br />Mon-Sat: 8:00 AM – 7:00 PM</div>
                </div>
                <div className="map-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  <div><strong>Landmark:</strong><br />Near Peñaranda Park</div>
                </div>
              </div>
              <div className="map-section__btns">
                <a href="https://maps.google.com/?q=4PRJ%2B32W+Old+Albay+District+Legazpi+City+Albay" target="_blank" rel="noopener noreferrer" className="btn-primary map-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  Get Directions
                </a>
                <button className="btn-outline map-btn" onClick={() => navigator.clipboard.writeText('4PRJ+32W, Old Albay District, Legazpi City, Albay')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div className="map-section__map-wrap">
              <iframe className="map-section__map" title="Jazsam Coffee location" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Jazsam+Coffee+4PRJ%2B32W+Old+Albay+Legazpi+City+Albay&output=embed" />
            </div>
          </div>
        </div>
      </section>

      {/* ────────── REVIEWS ────────── */}
      <section className="reviews-section section-pad">
        <div className="container reviews-section__inner">
          <div className="reviews-section__left">
            <p className="reviews-section__got">Got thoughts?</p>
            <p className="reviews-section__headline"><strong>Help us improve.</strong></p>
            <p className="reviews-section__desc">Every review matters. Your feedback guides us in delivering better coffee and service.</p>
          </div>
          <div className="reviews-section__right">
            <p className="reviews-section__label">Leave a review on the following platforms:</p>
            <div className="reviews-section__cards">
              <a href="https://search.google.com/local/writereview?placeid=ChIJvQyNOAADoTMRddAjPHvdwv4" className="rev-card" target="_blank" rel="noopener noreferrer">
                <div className="rev-card__icon rev-card__icon--maps">
                  <img src="/gmap.png" alt="Google Maps" width="40" height="40" style={{ objectFit: 'contain' }} />
                </div>
                <div className="rev-card__body">
                  <div className="rev-card__name">Jazsam Coffee</div>
                  <div className="rev-card__address">4PLJ+32W, Old Albay District, Legazpi City, Albay</div>
                  <div className="rev-card__rating">
                    <div className="rev-card__stars">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ color: s <= Math.round(gmapsRating.rating ?? 3) ? '#FBBC05' : '#d0d0d0', fontSize: '0.9rem' }}>★</span>
                      ))}
                    </div>
                    <span className="rev-card__count">
                      {gmapsRating.rating !== null ? `${gmapsRating.rating.toFixed(1)} ★ (${gmapsRating.total})` : '— ★ (—)'}
                    </span>
                  </div>
                  <button className="rev-card__btn rev-card__btn--maps">Rate us on Google Maps</button>
                </div>
              </a>
              <a href="https://www.facebook.com/profile.php?id=100089723943955" className="rev-card" target="_blank" rel="noopener noreferrer">
                <div className="rev-card__icon rev-card__icon--fb">
                  <img src="/fb.png" alt="Facebook" width="40" height="40" style={{ objectFit: 'contain' }} />
                </div>
                <div className="rev-card__body">
                  <div className="rev-card__name">Jazsam</div>
                  <div className="rev-card__followers">1.2k followers</div>
                  <div className="rev-card__address">4PLJ+32W, Old Albay District, Legazpi City, Albay</div>
                  <button className="rev-card__btn rev-card__btn--fb">Rate us on Facebook</button>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
