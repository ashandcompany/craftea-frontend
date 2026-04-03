'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Coffee, 
  Sparkles, 
  Users, 
  Globe, 
  Shield,
  Star,
  Quote,
  Award,
  Clock,
  Mail,
  MapPin,
  Phone,
  Palette,
  Camera,
  Rocket,
  Zap,
  Compass,
  Hourglass,
} from 'lucide-react';
import { artists as artistsApi, products, categories, type ArtistProfile } from '@/lib/api';

function formatCount(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

export default function AboutPage() {
  const [artistCount, setArtistCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [featuredArtists, setFeaturedArtists] = useState<ArtistProfile[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  useEffect(() => {
    artistsApi.list().then((a) => {
      setArtistCount(a.length);
      setFeaturedArtists(a.filter((x) => x.validated).slice(0, 3));
    }).catch(() => {}).finally(() => setLoadingArtists(false));

    products.list({ limit: 1 }).then((p) => setProductCount(p.total)).catch(() => {});
    categories.list().then((c) => setCategoryCount(c.length)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header avec effet parallaxe */}
      <div className="relative border-b-2 border-sage-200 bg-linear-to-r from-sage-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800 
                       border-b border-sage-200 hover:border-sage-400 transition-colors mb-6 group"
          >
            <span className="text-sage-400 group-hover:-translate-x-0.5 transition-transform">←</span>
            <span className="uppercase tracking-wider">retour à l'accueil</span>
          </Link>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={28} className="text-sage-500" strokeWidth={1.5} />
                <span className="text-xs text-sage-500 uppercase tracking-wider">// since 2024</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-stone-900 leading-tight">
                Là où la créativité
                <span className="block text-sage-600">rencontre l'artisanat</span>
              </h1>
              <p className="text-stone-500 text-sm mt-4 leading-relaxed max-w-md">
                Craftea est une marketplace dédiée aux créateurs indépendants.
                Nous connectons artisans passionnés et acheteurs à la recherche
                de pièces uniques, faites à la main avec soin.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-sage-100 flex items-center justify-center">
                      <span className="text-[8px] text-sage-600">●</span>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-stone-400">
                  {artistCount === null ? '...' : `${formatCount(artistCount)} artisan${artistCount > 1 ? 's' : ''} actif${artistCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            
            {/* Image placeholder - effet polaroid */}
            <div className="relative group">
              <div className="absolute -top-3 -left-3 w-full h-full border-2 border-sage-200 bg-sage-100/30 group-hover:rotate-2 transition-transform duration-300" />
              <div className="relative bg-white border-2 border-sage-200 p-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="aspect-square bg-linear-to-br from-sage-100 to-sage-50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-sage-300 rounded-full blur-3xl" />
                  </div>
                  <Camera size={48} className="text-sage-300" strokeWidth={1} />
                  <div className="absolute bottom-2 right-2 text-[8px] text-sage-400 bg-white/80 px-1">
                    📸 [image placeholder]
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-stone-400 font-mono">_notre_atelier.jpg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-20">
          
          {/* Section Citation avec image */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative order-2 md:order-1">
              <div className="border-2 border-sage-200 bg-sage-50/20 p-8 relative rotate-1 hover:rotate-0 transition-transform duration-300">
                <Quote size={40} className="text-sage-300 absolute top-4 left-4" strokeWidth={1} />
                <Quote size={40} className="text-sage-300 absolute bottom-4 right-4 rotate-180" strokeWidth={1} />
                <p className="text-lg text-stone-700 italic font-light leading-relaxed mt-8">
                  "Chaque objet raconte une histoire, celle de la personne qui l'a façonné avec ses mains, son temps et sa passion."
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-sage-500">
                  <span className="w-8 h-px bg-sage-300" />
                  <span>— L'esprit Craftea</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="border-2 border-sage-200 bg-white p-3 shadow-md rotate-[-2deg] hover:rotate-0 transition-transform">
                <div className="aspect-[4/3] bg-linear-to-tr from-amber-100 to-sage-100 flex items-center justify-center relative">
                  <Coffee size={40} className="text-sage-400" strokeWidth={1} />
                  <div className="absolute bottom-2 left-2 text-[8px] text-stone-400 bg-white/80 px-1">
                    [notre_philosophie.png]
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notre Histoire - style timeline */}
          <div className="border-2 border-sage-200 bg-white overflow-hidden">
            <div className="border-b-2 border-sage-200 px-8 py-5 bg-linear-to-r from-sage-50/50 to-white">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-sage-500" strokeWidth={1.5} />
                <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
                  &gt; Chronologie
                </h2>
                <span className="text-[10px] text-sage-400 ml-2">notre évolution</span>
              </div>
            </div>
            <div className="p-8">
              <div className="relative">
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-sage-200" />
                {[
                  { year: '2024', title: 'La Naissance', desc: "L'idée naît d'un constat simple : les artisans méritent une vitrine à leur hauteur. Craftea voit le jour avec ses premiers créateurs pionniers.", icon: Rocket },
                  { year: '2025', title: "L'Expansion", desc: 'La communauté grandit. Bijoux, céramiques, textiles, illustrations... Des centaines de créateurs rejoignent la plateforme.', icon: Zap },
                  { year: '2026', title: "Aujourd'hui", desc: "Plus de 1 000 artisans font confiance à Craftea. Chaque jour, de nouvelles pièces uniques trouvent leur maison.", icon: Star },
                ].map((item, idx) => (
                  <div key={idx} className={`relative flex flex-col md:flex-row gap-4 mb-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className="absolute left-4 md:left-1/2 w-3 h-3 -translate-x-1.5 md:-translate-x-1.5 rounded-full bg-sage-400 border-2 border-white top-1 z-10" />
                    <div className={`flex-1 ml-12 md:ml-0 ${idx % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                      <div className="inline-block border-2 border-sage-200 px-3 py-1 bg-sage-50/50 mb-2">
                        <span className="text-[10px] font-mono text-sage-600">{item.year}</span>
                      </div>
                      <h3 className="text-base font-medium text-stone-800">{item.title}</h3>
                      <p className="text-xs text-stone-500 mt-1">{item.desc}</p>
                    </div>
                    <div className="hidden md:block flex-1">
                      <div className="w-12 h-12 border-2 border-sage-200 rounded-full flex items-center justify-center bg-white mx-auto">
                        <item.icon size={20} className="text-sage-400" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* À Propos - Créatrice en solo */}
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 border-2 border-sage-200 px-4 py-2 bg-sage-50/30">
                <Sparkles size={14} className="text-sage-500" />
                <span className="text-xs uppercase tracking-wider text-sage-700">Projet en solo</span>
              </div>
              <h2 className="text-2xl font-light text-stone-800 mt-4">Derrière Craftea</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
                Un projet porté par la passion, conçu et développé de A à Z avec cœur
              </p>
            </div>
            <div className="flex justify-center">
              <div 
                className="group relative border-2 border-sage-200 bg-white hover:border-sage-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full max-w-sm"
              >
                <div className="bg-linear-to-br from-amber-100 to-sage-100 p-6 text-center border-b-2 border-sage-100">
                  <div className="w-32 h-32 mx-auto mb-4 border-2 border-sage-200 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm group-hover:scale-105 transition-transform">
                    🎨
                  </div>
                  <h3 className="text-lg font-medium text-stone-800">Emma Durand</h3>
                  <p className="text-[11px] text-sage-600 mt-2 uppercase tracking-wider">Fondatrice & Développeuse</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-stone-600 text-center leading-relaxed">
                    Passionnée par l'artisanat et la créativité, j'ai créé Craftea pour offrir une vitrine authentique aux créateurs indépendants. Design, développement, stratégie, je porte le projet de bout en bout avec la conviction que chaque objet mérite l'attention qu'il réclame.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-sage-400">
                    <span className="w-6 h-px bg-sage-200" />
                    <span>✧</span>
                    <span className="w-6 h-px bg-sage-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chiffres clés avec style original */}
          <div className="relative bg-linear-to-r from-sage-50/50 to-white border-2 border-sage-200 p-8">
            <div className="absolute top-2 right-3 text-[10px] text-sage-300">⏎</div>
            <div className="text-center mb-8">
              <span className="text-xs text-sage-500 uppercase tracking-wider">// en chiffres</span>
              <h2 className="text-xl font-light text-stone-800 mt-2">Quelques repères</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '1k+', label: 'Artisans', icon: Heart, desc: 'actifs sur la plateforme' },
                { value: '5k+', label: 'Créations', icon: Award, desc: 'pièces uniques en ligne' },
                { value: '15+', label: 'Catégories', icon: Clock, desc: 'univers créatifs' },
                { value: '24/7', label: 'Support', icon: Globe, desc: 'disponible' },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-sage-200 rounded-full bg-white mb-3 group-hover:border-sage-400 transition-colors">
                    <stat.icon size={20} className="text-sage-500" strokeWidth={1.5} />
                  </div>
                  <div className="text-2xl font-light text-sage-700">{stat.value}</div>
                  <div className="text-[11px] font-medium text-stone-600 mt-1">{stat.label}</div>
                  <div className="text-[9px] text-stone-400">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Valeurs - grille créative */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Authenticité', icon: Heart, color: 'from-rose-100 to-sage-100', desc: "Chaque création est unique, faite à la main par un artisan passionné. Chez Craftea, pas de production de masse, seulement du vrai." },
              { title: 'Créativité', icon: Palette, color: 'from-amber-100 to-sage-100', desc: 'Bijoux, céramique, textile, illustration... Nous célébrons toutes les formes d\'expression artistique et soutenons la diversité créative.' },
              { title: 'Qualité', icon: Shield, color: 'from-emerald-100 to-sage-100', desc: 'Chaque boutique est vérifiée avant publication. Nous accompagnons les artisans pour que leurs acheteurs reçoivent le meilleur.' },
              { title: 'Communauté', icon: Users, color: 'from-blue-100 to-sage-100', desc: 'Craftea, c\'est une communauté. Artisans et acheteurs partagent une passion commune pour l\'artisanat authentique et le fait main.' },
            ].map((value, index) => (
              <div key={index} className="group relative border-2 border-sage-200 bg-white p-6 hover:border-sage-300 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-linear-to-br ${value.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <value.icon size={20} className="text-sage-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-800 mb-1">{value.title}</h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact & Localisation avec carte stylisée */}
          <div className="border-2 border-sage-200 bg-white overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 bg-linear-to-br from-sage-50/30 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <Compass size={18} className="text-sage-500" strokeWidth={1.5} />
                  <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700">&gt; Nous Rencontrer</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-sage-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-stone-700">15 Rue des Artisans</p>
                      <p className="text-sm text-stone-700">75011 Paris, France</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-sage-400 shrink-0" />
                    <a href="mailto:hello@craftea.fr" className="text-sm text-sage-600 hover:text-sage-800 border-b border-sage-200 hover:border-sage-400 transition-colors">
                      hello@craftea.fr
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-sage-400 shrink-0" />
                    <span className="text-sm text-stone-700">+33 (0)1 84 17 92 10</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-sage-100">
                  <div className="flex items-center gap-2 text-[10px] text-sage-500">
                    <span className="animate-pulse">●</span>
                    <span>Ouvert du lundi au vendredi</span>
                    <span className="text-sage-300 mx-1">|</span>
                    <span>9h - 18h</span>
                  </div>
                </div>
              </div>
              <div className="border-l-2 border-sage-200 overflow-hidden min-h-[250px]">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=2.342%2C48.847%2C2.362%2C48.866&layer=mapnik&marker=48.8566%2C2.3522"
                  className="w-full h-full min-h-[250px]"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Localisation Craftea"
                />
              </div>
            </div>
          </div>

          {/* Footer signature */}
          <div className="text-center space-y-4 pt-8">
            <div className="flex items-center justify-center gap-2 text-[10px] text-sage-400">
              <span className="w-8 h-px bg-sage-200" />
              <span>///</span>
              <span className="text-stone-400">Fait avec ♥ par des passionnés pour des passionnés</span>
              <span>///</span>
              <span className="w-8 h-px bg-sage-200" />
            </div>
            <div className="flex items-center justify-center gap-2 text-[9px] text-stone-400">
              <span>⏎</span>
              <span>mis à jour le {new Date().toLocaleDateString('fr-FR')}</span>
              <span>⏎</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}