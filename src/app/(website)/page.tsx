"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// Particle System Component
const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      originalPositions[i3] = positions[i3];
      originalPositions[i3 + 1] = positions[i3 + 1];
      originalPositions[i3 + 2] = positions[i3 + 2];

      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    originalPositionsRef.current = originalPositions;
    velocitiesRef.current = velocities;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Lines between particles
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.15,
    });

    // Animation
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      const positions = particles.geometry.attributes.position
        .array as Float32Array;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Gentle floating motion
        positions[i3] += velocities[i3] + Math.sin(time + i * 0.1) * 0.01;
        positions[i3 + 1] +=
          velocities[i3 + 1] + Math.cos(time + i * 0.1) * 0.01;

        // Mouse interaction - particles move away from cursor
        const dx = positions[i3] - mouseX * 50;
        const dy = positions[i3 + 1] - mouseY * 50;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          const force = (15 - dist) / 15;
          positions[i3] += dx * force * 0.05;
          positions[i3 + 1] += dy * force * 0.05;
        }

        // Return to original position slowly
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        positions[i3] += (origX - positions[i3]) * 0.01;
        positions[i3 + 1] += (origY - positions[i3 + 1]) * 0.01;

        // Boundary check
        if (Math.abs(positions[i3]) > 60) velocities[i3] *= -1;
        if (Math.abs(positions[i3 + 1]) > 60) velocities[i3 + 1] *= -1;
      }

      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
      }}
    />
  );
};

// Animated Section Component
const AnimatedSection = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // ✅ no timeout
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }} // ✅ delay handled safely
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Card Component with Hover Effects
const Card = ({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <div
        className={`relative p-8 rounded-2xl border transition-all duration-500 overflow-hidden ${
          isHovered
            ? "border-orange-500/50 bg-white/5"
            : "border-white/10 bg-white/[0.02]"
        }`}
        style={{
          background: isHovered
            ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,102,0,0.15) 0%, transparent 50%)`
            : undefined,
        }}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,102,0,0.3) 0%, transparent 60%)`,
            filter: "blur(20px)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-orange-500 text-sm font-medium tracking-wider">
              {number}
            </span>
            <div
              className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 ${
                isHovered ? "border-orange-500/50 scale-110" : ""
              }`}
            >
              <svg
                className="w-5 h-5 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={icon}
                />
              </svg>
            </div>
          </div>

          <h3
            className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
              isHovered ? "text-orange-400" : "text-white"
            }`}
          >
            {title}
          </h3>

          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Corner accent */}
        <div
          className={`absolute top-0 right-0 w-20 h-20 transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Portfolio Card
const PortfolioCard = ({
  company,
  category,
  description,
  image,
}: {
  company: string;
  category: string;
  description: string;
  image: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-neutral-900">
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 z-10 ${
            isHovered ? "opacity-90" : "opacity-60"
          }`}
        />

        {/* Placeholder for company image */}
        <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
          <div className="text-6xl font-bold text-white/10">{company[0]}</div>
        </div>

        {/* Animated border */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 transition-all duration-500 z-20 ${
            isHovered ? "border-orange-500/50" : "border-transparent"
          }`}
        >
          <div
            className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              boxShadow:
                "inset 0 0 30px rgba(255,102,0,0.2), 0 0 30px rgba(255,102,0,0.1)",
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-30 transform transition-transform duration-500">
          <div
            className={`text-orange-500 text-xs font-medium tracking-wider mb-2 transition-all duration-500 ${
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-70"
            }`}
          >
            {category}
          </div>
          <h3
            className={`text-2xl font-bold text-white mb-2 transition-all duration-500 ${
              isHovered ? "translate-y-0 text-orange-100" : "translate-y-0"
            }`}
          >
            {company}
          </h3>
          <p
            className={`text-white/70 text-sm leading-relaxed transition-all duration-500 ${
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {description}
          </p>
        </div>

        {/* Particle burst on hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-orange-500 rounded-full animate-ping"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Team Member Card
const TeamCard = ({
  name,
  role,
  bio,
}: {
  name: string;
  role: string;
  bio: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative p-6 rounded-xl border transition-all duration-500 ${
          isHovered
            ? "border-orange-500/30 bg-white/5"
            : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 flex items-center justify-center text-xl font-bold transition-all duration-500 ${
              isHovered ? "scale-110 from-orange-500/40 to-orange-600/20" : ""
            }`}
          >
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-lg mb-1">{name}</h4>
            <p className="text-orange-500 text-sm mb-2">{role}</p>
            <p
              className={`text-white/60 text-sm leading-relaxed transition-all duration-500 ${
                isHovered ? "opacity-100" : "opacity-70"
              }`}
            >
              {bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Ethos", href: "#ethos" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Team", href: "#team" },
    { label: "Approach", href: "#approach" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="#"
          className="text-white font-bold text-xl tracking-tight hover:text-orange-500 transition-colors"
        >
          WorldQuant<span className="text-orange-500">Foundry</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white/70 text-sm hover:text-orange-500 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-orange-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <button className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25">
            Apply Now
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                mobileMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 transition-all duration-500 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-white/70 hover:text-orange-500 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button className="w-full px-5 py-3 bg-orange-500 text-white font-medium rounded-full">
            Apply Now
          </button>
        </div>
      </div>
    </nav>
  );
};

// Main Page Component
export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pillars = [
    {
      number: "01 / 04",
      title: "Exponential Foresight",
      description:
        "We spot industry trends before they permeate the industry. Transform them into companies that matter. Some call it foresight. We call it pattern recognition at scale.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
    {
      number: "02 / 04",
      title: "Velocity Architecture",
      description:
        "Speed is our currency. We build infrastructure that compresses years into months. Our systems are designed for rapid iteration, allowing founders to move at the pace of thought.",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      number: "03 / 04",
      title: "Deep Capital Networks",
      description:
        "Capital is just the beginning. We open doors to the worlds most strategic investors, operators, and domain experts. Your network is your net worth, and we make you wealthy.",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      number: "04 / 04",
      title: "Full-Stack Mentorship",
      description:
        "From technical architecture to go-to-market strategy, our mentors have built billion-dollar companies. They dont just advise—they roll up their sleeves and build alongside you.",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
  ];

  const portfolio = [
    {
      company: "Axiom",
      category: "Artificial Intelligence",
      description:
        "Autonomous reasoning engines for enterprise decision making. Reducing complex operational choices from weeks to milliseconds.",
    },
    {
      company: "Helion",
      category: "Climate Tech",
      description:
        "Next-generation fusion energy systems. Clean, abundant power through breakthrough confinement technology.",
    },
    {
      company: "Neuralink",
      category: "Neurotechnology",
      description:
        "Brain-computer interfaces restoring autonomy to millions. The first commercial neural lace platform.",
    },
    {
      company: "QuantumCircuits",
      category: "Quantum Computing",
      description:
        "Fault-tolerant quantum processors for drug discovery and materials science. Error correction at scale.",
    },
    {
      company: "Starship",
      category: "Aerospace",
      description:
        "Fully reusable orbital transportation system. Making life multi-planetary through radical cost reduction.",
    },
    {
      company: "SyntheticGenomics",
      category: "Biotech",
      description:
        "Programmable biological systems engineering custom organisms for sustainable manufacturing.",
    },
  ];

  const team = [
    {
      name: "Igor Tulchinsky",
      role: "Founder & CEO",
      bio: "Former quant trader, built WorldQuant into a global powerhouse. Now forging the next generation of breakthrough companies.",
    },
    {
      name: "Dr. Sarah Chen",
      role: "Chief Science Officer",
      bio: "Ex-DARPA, MIT Media Lab. Led development of foundational AI architectures now deployed across Fortune 500.",
    },
    {
      name: "Marcus Webb",
      role: "Managing Partner",
      bio: "Serial entrepreneur, 4 exits totaling $8B+. Deep network in enterprise SaaS and infrastructure.",
    },
    {
      name: "Elena Volkov",
      role: "Head of Engineering",
      bio: "Former principal engineer at Google Brain. Architected systems processing exabytes daily.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <ParticleBackground />
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 mb-8">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 text-sm font-medium tracking-wider">
                NOW ACCEPTING APPLICATIONS
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
              Forging Companies that{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 animate-gradient">
                Pull the Future
              </span>{" "}
              Forward
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed">
              WorldQuant Foundry is a venture lab that empowers breakthrough
              founders to pull the future forward. Capital. Connections.
              Mentorship. Full-stack support.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 overflow-hidden">
                <span className="relative z-10">Apply to Foundry</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button className="group px-8 py-4 border border-white/20 hover:border-orange-500/50 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/5 flex items-center gap-2">
                View Portfolio
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400} className="mt-20">
            <div className="flex items-center justify-center gap-12 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>$500M+ Deployed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>50+ Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>200+ Experts</span>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Ethos Section */}
      <section id="ethos" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="mb-20">
              <h2 className="text-orange-500 text-sm font-medium tracking-wider mb-4">
                OUR ETHOS
              </h2>
              <div className="grid md:grid-cols-2 gap-12 items-end">
                <div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6">
                    Vision matters.
                  </h3>
                  <h3 className="text-4xl md:text-5xl font-bold text-white/40">
                    Velocity wins.
                  </h3>
                </div>
                <p className="text-white/60 text-lg leading-relaxed">
                  Our comprehensive founder platform shifts the odds. With
                  infrastructure that works. With experts who&apos;ve been
                  there. With the right pressure—pushing you forward, not under.
                  This isn&apos;t an accelerator. It&apos;s complete company
                  building, at the speed deep tech demands.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((pillar, index) => (
              <AnimatedSection key={pillar.number} delay={index * 100}>
                <Card {...pillar} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="relative py-32 px-6 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
              <div>
                <h2 className="text-orange-500 text-sm font-medium tracking-wider mb-4">
                  OUR PORTFOLIO
                </h2>
                <h3 className="text-4xl md:text-5xl font-bold">
                  Companies shaping tomorrow
                </h3>
              </div>
              <button className="mt-6 md:mt-0 group flex items-center gap-2 text-white/70 hover:text-orange-500 transition-colors">
                View all companies
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((company, index) => (
              <AnimatedSection key={company.company} delay={index * 100}>
                <PortfolioCard {...company} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-orange-500 text-sm font-medium tracking-wider mb-4">
                THE TEAM
              </h2>
              <h3 className="text-4xl md:text-5xl font-bold mb-6">
                Builders backing builders
              </h3>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Our team has founded, scaled, and exited category-defining
                companies. Now we&apos;re dedicated to helping the next
                generation of founders achieve the extraordinary.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <AnimatedSection key={member.name} delay={index * 100}>
                <TeamCard {...member} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section id="approach" className="relative py-32 px-6 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-orange-500 text-sm font-medium tracking-wider mb-4">
                  OUR APPROACH
                </h2>
                <h3 className="text-4xl md:text-5xl font-bold mb-6">
                  We don&apos;t just invest.
                  <br />
                  We co-create.
                </h3>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  Traditional VCs write checks and wait for updates. We embed
                  ourselves as co-founders from day zero. Our model is simple:
                  we bring the full weight of WorldQuant&apos;s
                  resources—capital, compute, data, talent—to bear on your
                  hardest problems.
                </p>

                <div className="space-y-4">
                  {[
                    "Dedicated engineering pods for rapid prototyping",
                    "Access to proprietary datasets and infrastructure",
                    "Direct line to WorldQuant&apos;s global talent network",
                    "Structured path to Series A with top-tier co-investors",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 text-orange-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4">
                      0→1
                    </div>
                    <p className="text-white/60">
                      We specialize in the impossible phase
                    </p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 border border-orange-500/20 rounded-full animate-pulse" />
                <div
                  className="absolute -bottom-4 -left-4 w-32 h-32 border border-orange-500/10 rounded-full"
                  style={{ animation: "pulse 3s infinite" }}
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to pull the future forward?
            </h2>
            <p className="text-white/60 text-xl mb-12 max-w-2xl mx-auto">
              We&apos;re currently reviewing applications for our next cohort.
              If you&apos;re working on something that shouldn&apos;t exist yet,
              we want to hear from you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group relative px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Application
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button className="px-10 py-5 border border-white/20 hover:border-orange-500/50 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/5">
                Contact Us
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <a
                href="#"
                className="text-white font-bold text-xl tracking-tight mb-4 block"
              >
                WorldQuant<span className="text-orange-500">Foundry</span>
              </a>
              <p className="text-white/50 text-sm max-w-sm">
                A venture lab empowering breakthrough founders to pull the
                future forward. Part of the WorldQuant ecosystem.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <a
                    href="#ethos"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Ethos
                  </a>
                </li>
                <li>
                  <a
                    href="#portfolio"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Portfolio
                  </a>
                </li>
                <li>
                  <a
                    href="#team"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#approach"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Approach
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-500 transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>© 2024 WorldQuant Foundry. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white/60 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white/60 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}
