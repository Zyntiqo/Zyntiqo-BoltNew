import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

const links = [
  { name: 'Home', to: '/' },
  { name: 'Services', to: '/#services' },
  { name: 'Solutions', to: '/#solutions' },
  { name: 'How It Works', to: '/#how-it-works' },
  { name: 'Portfolio', to: '/#portfolio' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleHashLink = (e: React.MouseEvent, to: string) => {
    if (to.includes('#')) {
      const hash = to.split('#')[1];
      e.preventDefault();
      setOpen(false);
      if (location.pathname !== '/') {
        navigate(`/#${hash}`);
      } else {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]' : 'bg-transparent'
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between sm:h-20">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-ink-300 hover:text-white'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button to="/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button to="/contact" size="sm">
            Get Started
          </Button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-200 hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container-page border-t border-white/5 bg-ink-950/95 pb-6 pt-4 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={(e) => handleHashLink(e, link.to)}
                className="rounded-lg px-4 py-3 text-base font-medium text-ink-200 hover:bg-white/5 hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button to="/contact" size="md" className="w-full">
              Get Started
            </Button>
            <Button to="/book-consultation" variant="secondary" size="md" className="w-full">
              Book a Call
            </Button>
          </div>
          <div className="mt-3">
            <Button to="/login" variant="ghost" size="md" className="w-full">
              Login →
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
