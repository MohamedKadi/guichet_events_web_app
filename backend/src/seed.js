require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    // Always ensure admin account exists
    const adminEmail = 'admin@guichet.ma';
    const { rows: adminRows } = await client.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('Admin@2026!', 10);
      await client.query(
        'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)',
        ['Super Admin', adminEmail, hash]
      );
      console.log('Admin account created: admin@guichet.ma / Admin@2026!');
    }

    const { rows: existing } = await client.query('SELECT COUNT(*) FROM events');
    if (parseInt(existing[0].count) > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    // Seed categories
    await client.query(`
      INSERT INTO categories (name, slug, icon) VALUES
        ('Concerts', 'concerts', '🎵'),
        ('Festivals', 'festivals', '🎪'),
        ('Théâtre & Humour', 'theatre-humour', '🎭'),
        ('Cinéma', 'cinema', '🎬'),
        ('Sport', 'sport', '⚽'),
        ('Divertissement', 'divertissement', '🎠'),
        ('Jeune Public', 'jeune-public', '👶'),
        ('Salon & Formation', 'salon-formation', '🎓')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed vibes
    await client.query(`
      INSERT INTO vibes (name, slug, emoji) VALUES
        ('Party',   'party',   '🎉'),
        ('Romance', 'romance', '💘'),
        ('Sports',  'sports',  '🏆'),
        ('Chill',   'chill',   '😌'),
        ('Culture', 'culture', '🎭')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed events
    await client.query(`
      INSERT INTO events (title, description, category_id, vibe_id, city, venue, event_date, price, image_url, organizer, is_featured, is_trending, tickets_available, click_count)
      VALUES
        (
          'COMEDIABLANCA FESTIVAL - Blind Pass',
          'Le plus grand festival de comédie au Maroc revient avec un Pass 3 jours exceptionnel. Profitez de spectacles de stand-up, de sketches et de surprises incroyables au Complexe Mohammed V.',
          (SELECT id FROM categories WHERE slug = 'festivals'),
          (SELECT id FROM vibes WHERE slug = 'party'),
          'Casablanca',
          'Complexe Mohammed V, Casablanca',
          '2026-06-04 20:00:00',
          300.00,
          'https://picsum.photos/seed/comediablanca/800/500',
          'Guichet',
          TRUE,
          TRUE,
          500,
          1240
        ),
        (
          'Basketball Africa League - IT''S TAKEOFF TIME',
          'La Basketball Africa League revient à Rabat pour une nouvelle saison explosive. Vivez l''intensité du basketball africain de haut niveau dans une atmosphère électrisante.',
          (SELECT id FROM categories WHERE slug = 'sport'),
          (SELECT id FROM vibes WHERE slug = 'sports'),
          'Rabat',
          'Complexe Sportif Prince Moulay Abdellah, Rabat',
          '2026-04-24 18:00:00',
          150.00,
          'https://picsum.photos/seed/basketball/800/500',
          'BAL Africa',
          TRUE,
          TRUE,
          2000,
          980
        ),
        (
          'HALIM - The Interactive Immersive Hologram Concert',
          'Vivez une expérience musicale unique avec le concert hologramme immersif de HALIM. Une fusion de technologie de pointe et de musique live pour une soirée inoubliable.',
          (SELECT id FROM categories WHERE slug = 'concerts'),
          (SELECT id FROM vibes WHERE slug = 'party'),
          'Casablanca',
          'Complexe Sportif Mohammed V, Casablanca',
          '2026-04-10 20:30:00',
          500.00,
          'https://picsum.photos/seed/halim/800/500',
          'X Events',
          TRUE,
          FALSE,
          800,
          654
        ),
        (
          'HAROUN - Bonjour quand même',
          'Haroun revient sur scène avec son nouveau spectacle "Bonjour quand même". Un one-man show plein d''humour et d''authenticité au Théâtre Mohammed V de Rabat.',
          (SELECT id FROM categories WHERE slug = 'theatre-humour'),
          (SELECT id FROM vibes WHERE slug = 'culture'),
          'Rabat',
          'Théâtre Mohammed V, Rabat',
          '2026-05-13 20:00:00',
          250.00,
          'https://picsum.photos/seed/haroun/800/500',
          'LMA Productions',
          TRUE,
          TRUE,
          350,
          789
        ),
        (
          'LFICH7A - Ramadan Karim',
          'Le spectacle comique de Ramadan le plus attendu est de retour ! Une soirée de rires et de bonne humeur avec toute la famille au Mégarama Casablanca.',
          (SELECT id FROM categories WHERE slug = 'theatre-humour'),
          (SELECT id FROM vibes WHERE slug = 'culture'),
          'Casablanca',
          'Mégarama Casablanca',
          '2026-03-14 22:00:00',
          200.00,
          'https://picsum.photos/seed/lfich7a/800/500',
          'Garche Productions',
          TRUE,
          FALSE,
          600,
          445
        ),
        (
          'Le Porteur d''Histoire',
          'Le chef-d''œuvre d''Alexis Michalik débarque à Rabat. Un spectacle salué par la critique internationale mêlant aventure, romance et mystère dans une mise en scène époustouflante.',
          (SELECT id FROM categories WHERE slug = 'theatre-humour'),
          (SELECT id FROM vibes WHERE slug = 'culture'),
          'Rabat',
          'Théâtre Bahnini, Rabat',
          '2026-04-08 20:00:00',
          180.00,
          'https://picsum.photos/seed/porteur/800/500',
          'Alliance Française',
          FALSE,
          TRUE,
          200,
          312
        ),
        (
          'EXTREME CIRQUE de Verin',
          'Le cirque le plus spectaculaire du monde pose ses chapiteaux au Maroc. Acrobaties, magie, animaux et numéros époustouflants pour toute la famille.',
          (SELECT id FROM categories WHERE slug = 'divertissement'),
          (SELECT id FROM vibes WHERE slug = 'chill'),
          'Casablanca',
          'Parc de la Ligue Arabe, Casablanca',
          '2026-03-20 19:00:00',
          120.00,
          'https://picsum.photos/seed/cirque/800/500',
          'EXTREME CIRQUE',
          FALSE,
          TRUE,
          1500,
          567
        ),
        (
          'NOSTALGIA LOVERS FESTIVAL',
          'Le festival dédié aux amateurs de musique des années 80, 90 et 2000. Retrouvez vos artistes favoris sur scène pour une nuit de nostalgie et de danse.',
          (SELECT id FROM categories WHERE slug = 'festivals'),
          (SELECT id FROM vibes WHERE slug = 'party'),
          'Casablanca',
          'Anfa Park, Casablanca',
          '2026-04-15 20:00:00',
          400.00,
          'https://picsum.photos/seed/nostalgia/800/500',
          'Nostalgia Events',
          FALSE,
          TRUE,
          3000,
          890
        ),
        (
          'OTHMAN GULAYDE - Le Cœur du Chaabi',
          'Othman Gulayde vous invite à un voyage musical au cœur du Chaabi marocain. Une soirée authentique célébrant le patrimoine musical de notre pays.',
          (SELECT id FROM categories WHERE slug = 'concerts'),
          (SELECT id FROM vibes WHERE slug = 'chill'),
          'Casablanca',
          'Théâtre Mohammed V, Casablanca',
          '2026-04-03 20:30:00',
          220.00,
          'https://picsum.photos/seed/chaabi/800/500',
          'Vague Prod',
          FALSE,
          FALSE,
          400,
          234
        ),
        (
          'J-Yane Event - Soirée Andalouse',
          'Une soirée magique dédiée à la musique andalouse marocaine. Vivez l''enchantement des mélodies et des rythmes ancestraux dans un cadre exceptionnel.',
          (SELECT id FROM categories WHERE slug = 'concerts'),
          (SELECT id FROM vibes WHERE slug = 'romance'),
          'Rabat',
          'Palais des Congrès, Rabat',
          '2026-04-20 21:00:00',
          180.00,
          'https://picsum.photos/seed/jyane/800/500',
          'J-yane event',
          FALSE,
          FALSE,
          300,
          178
        ),
        (
          'Salon International du Livre de Casablanca',
          'La plus grande foire du livre du Maroc réunit éditeurs, auteurs et passionnés de lecture pour une semaine culturelle exceptionnelle.',
          (SELECT id FROM categories WHERE slug = 'salon-formation'),
          (SELECT id FROM vibes WHERE slug = 'culture'),
          'Casablanca',
          'Office des Foires et Expositions, Casablanca',
          '2026-05-20 10:00:00',
          50.00,
          'https://picsum.photos/seed/salon/800/500',
          'Marina Bouregreg Luxury',
          FALSE,
          FALSE,
          10000,
          345
        ),
        (
          'Festival Mawazine - Rythmes du Monde',
          'Le festival international de musique de Rabat revient pour une nouvelle édition avec des artistes mondiaux. Scènes gratuites et payantes dans toute la ville.',
          (SELECT id FROM categories WHERE slug = 'festivals'),
          (SELECT id FROM vibes WHERE slug = 'party'),
          'Rabat',
          'Scène OLM Souissi, Rabat',
          '2026-06-20 21:00:00',
          350.00,
          'https://picsum.photos/seed/mawazine/800/500',
          'Méydene',
          FALSE,
          FALSE,
          15000,
          456
        )
      ON CONFLICT (title) DO NOTHING;
    `);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = seed;

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
