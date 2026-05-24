import './About.css';

const GALLERY = [
  '/hero_coffee.png',
  '/display_cup_gallery.png',
  '/about_photos_grid.png',
  '/fries.png',
  '/display_cup.png',
];

export default function About() {
  return (
    <main className="about">
      {/* ── Hero Banner ── */}
      <section className="about__hero">
        <div className="about__hero-overlay" />
        <div className="container about__hero-inner">
          <h1 className="about__hero-title">Behind Jazsam</h1>
        </div>
      </section>

      {/* ── Where It All Began ── */}
      <section className="about__section section-pad">
        <div className="container about__grid">
          <div className="about__text-block">
            <h2 className="about__section-title">WHERE IT ALL BEGAN</h2>
            <p className="about__body">
              Jazsam Coffee started as a small family venture built on a shared love for home-brewed coffee and
              long conversations around the kitchen table. What began as experimenting with different beans and
              roast profiles soon turned into serving friends, neighbors, and eventually the local community.
              With encouragement from loyal customers and a passion for creating a welcoming space, the family
              opened Jazsam Coffee — a place where quality brews and genuine hospitality continue to define
              every cup served.
            </p>
          </div>
          <div className="about__image-block">
            <img src="/about_storefront.png" alt="Jazsam Coffee storefront" className="about__img" />
          </div>
        </div>
      </section>

      {/* ── Our Jazsam Community ── */}
      <section className="about__section about__section--alt section-pad">
        <div className="container about__grid about__grid--reverse">
          <div className="about__image-block">
            <img src="/about_community.png" alt="Jazsam Coffee community" className="about__img" />
          </div>
          <div className="about__text-block">
            <h2 className="about__section-title">OUR JAZSAM COMMUNITY</h2>
            <p className="about__body">
              Jazsam Coffee started as a small family venture built on a shared love for home-brewed coffee and
              long conversations around the kitchen table. What began as experimenting with different beans and
              roast profiles soon turned into serving friends, neighbors, and eventually the local community.
              With encouragement from loyal customers and a passion for creating a welcoming space, the family
              opened Jazsam Coffee — a place where quality brews and genuine hospitality continue to define
              every tap served.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="about__section section-pad">
        <div className="container about__grid">
          <div className="about__text-block">
            <h2 className="about__section-title">OUR MISSION AND VISION</h2>
            <p className="about__body">
              Jazsam Coffee started as a small family venture built on a shared love for home-brewed coffee and
              long conversations around the kitchen table. What began as experimenting with different beans and
              roast profiles soon turned into serving friends, neighbors, and eventually the local community.
              With encouragement from loyal customers and a passion for creating a welcoming space, the family
              opened Jazsam Coffee — a place where quality brews and genuine hospitality continue to define
              every cup served.
            </p>
          </div>
          <div className="about__image-block about__image-block--placeholder">
            <div className="about__placeholder-img">
              <img src="/mission-pic.png" alt="Mission and Vision" className="about__img" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote Banner ── */}
      <section className="about__quote">
        <div className="container">
          <p className="about__quote-text">
            From everyday visits,<br />
            <strong>to featured moments.</strong>
          </p>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="about__gallery-section section-pad">
        <div className="container">
          <div className="about__gallery">
            {GALLERY.map((src, i) => (
              <div key={i} className={`about__gallery-item about__gallery-item--${i + 1}`}>
                <img src={src} alt={`Gallery ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
