-- =====================================================
-- INSERT SAMPLE PRODUCTS for cartlink.id
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vptsxtlceielmajlpyda/sql
-- =====================================================

INSERT INTO products (title, description, price, original_price, category, category_label, image, rating, reviews, badge, featured, slug) VALUES

-- Ebook Products
('Panduan Lengkap Digital Marketing 2024', 
 'Ebook komprehensif tentang strategi digital marketing terbaru. Berisi 200+ halaman dengan studi kasus nyata dan template yang bisa langsung digunakan.', 
 149000, 299000, 'ebook', 'Ebook', 
 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 
 4.8, 256, 'Best Seller', true, 'panduan-lengkap-digital-marketing-2024'),

('Rahasia Sukses Bisnis Online', 
 'Pelajari cara memulai dan mengembangkan bisnis online dari nol hingga menghasilkan jutaan rupiah per bulan.', 
 99000, 199000, 'ebook', 'Ebook', 
 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=400', 
 4.6, 189, 'Hot', true, 'rahasia-sukses-bisnis-online'),

-- Kelas Digital Products
('Masterclass: UI/UX Design dari Nol', 
 'Kelas online lengkap untuk belajar UI/UX Design. 50+ video tutorial, project praktik, dan sertifikat kelulusan.', 
 599000, 1200000, 'kelas', 'Kelas Digital', 
 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', 
 4.9, 412, 'Best Seller', true, 'masterclass-ui-ux-design'),

('Kursus Web Development Full Stack', 
 'Belajar menjadi Full Stack Developer dengan HTML, CSS, JavaScript, React, Node.js dan database.', 
 749000, 1500000, 'kelas', 'Kelas Digital', 
 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', 
 4.7, 328, 'New', true, 'kursus-web-development-full-stack'),

-- Video Animasi Products
('Paket Video Animasi Edukasi Anak', 
 'Koleksi 50+ video animasi edukatif untuk anak usia 3-10 tahun. Topik meliputi alfabet, angka, sains, dan moral.', 
 299000, 499000, 'video', 'Video Animasi', 
 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=400', 
 4.8, 567, 'Best Seller', true, 'paket-video-animasi-edukasi-anak'),

('Video Tutorial After Effects', 
 'Kuasai motion graphics dengan Adobe After Effects. 30+ tutorial dari basic hingga advanced.', 
 399000, 799000, 'video', 'Video Animasi', 
 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400', 
 4.5, 145, NULL, false, 'video-tutorial-after-effects'),

-- Template Products
('Template Presentasi Premium', 
 'Koleksi 100+ template PowerPoint dan Google Slides untuk berbagai keperluan bisnis dan pendidikan.', 
 79000, 149000, 'template', 'Template', 
 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400', 
 4.6, 892, 'Hot', true, 'template-presentasi-premium'),

('Template CV & Resume Modern', 
 'Paket 50+ template CV dan resume profesional dalam format Word dan Canva.', 
 49000, 99000, 'template', 'Template', 
 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400', 
 4.4, 456, 'Promo', false, 'template-cv-resume-modern'),

-- Software Products
('Social Media Auto Poster Tool', 
 'Software untuk menjadwalkan dan memposting konten ke berbagai platform social media secara otomatis.', 
 499000, 999000, 'software', 'Software & Plugin', 
 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', 
 4.3, 234, 'New', true, 'social-media-auto-poster'),

('Plugin WordPress SEO Ultimate', 
 'Plugin WordPress lengkap untuk optimasi SEO website Anda. Fitur schema markup, sitemap, dan analysis tool.', 
 199000, 399000, 'software', 'Software & Plugin', 
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', 
 4.7, 678, 'Best Seller', true, 'plugin-wordpress-seo-ultimate'),

-- Audio Products
('Sound Effect Pack - Cinematic', 
 'Koleksi 500+ sound effect berkualitas tinggi untuk produksi video dan podcast.', 
 149000, 299000, 'audio', 'Audio & Musik', 
 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400', 
 4.5, 123, NULL, false, 'sound-effect-pack-cinematic'),

('Background Music - Corporate', 
 'Paket 100+ background music royalty-free untuk video corporate, iklan, dan presentasi.', 
 249000, 499000, 'audio', 'Audio & Musik', 
 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400', 
 4.6, 289, 'Hot', true, 'background-music-corporate');

-- Verify insertion
SELECT COUNT(*) as total_products FROM products;
