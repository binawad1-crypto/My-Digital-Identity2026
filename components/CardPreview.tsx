
import { Mail, Phone, Globe, MessageCircle, UserPlus, Camera, Download, QrCode, Cpu, Calendar, MapPin, Timer, PartyPopper, Navigation2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CardData, Language, TemplateConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { downloadVCard } from '../utils/vcard';
import { generateShareUrl } from '../utils/share';
import SocialIcon from './SocialIcon';

interface CardPreviewProps {
  data: CardData;
  lang: Language;
  customConfig?: TemplateConfig; 
  hideSaveButton?: boolean; 
}

const CountdownTimer = ({ targetDate, isDark, primaryColor }: { targetDate: string, isDark: boolean, primaryColor: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const Unit = ({ val, label }: { val: number, label: string }) => (
    <div className={`flex flex-col items-center justify-center flex-1 p-3 rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} border shadow-sm transition-all duration-500 hover:scale-105`}>
      <span className="text-xl font-black leading-none" style={{ color: primaryColor }}>{val}</span>
      <span className="text-[7px] font-black uppercase tracking-widest opacity-40 mt-1.5">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-2 justify-between w-full mt-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <Unit val={timeLeft.d} label="Days" />
      <Unit val={timeLeft.h} label="Hrs" />
      <Unit val={timeLeft.m} label="Min" />
      <Unit val={timeLeft.s} label="Sec" />
    </div>
  );
};

const CardPreview: React.FC<CardPreviewProps> = ({ data, lang, customConfig, hideSaveButton = false }) => {
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en'];

  const themeType = data.themeType || 'gradient';
  const themeColor = data.themeColor || '#3b82f6';
  const themeGradient = data.themeGradient || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  const backgroundImage = data.backgroundImage;
  const isDark = data.isDark;

  const config = customConfig || {} as TemplateConfig;
  const headerType = config.headerType || 'classic';
  const headerHeight = config.headerHeight || 180;

  const nameColor = data.nameColor || config.nameColor || (isDark ? '#ffffff' : '#111827');
  const titleColor = data.titleColor || config.titleColor || '#2563eb';
  const bioTextColor = data.bioTextColor || config.bioTextColor || (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)');
  const bioBgColor = data.bioBgColor || config.bioBgColor || (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)');
  const linksColor = data.linksColor || config.linksColor || '#3b82f6';
  const qrColorVal = (data.qrColor || config.qrColor || themeColor || '#000000').replace('#', '');

  const qrBorderWidth = data.qrBorderWidth ?? config.qrBorderWidth ?? 0;
  const qrBorderColor = data.qrBorderColor || config.qrBorderColor || 'transparent';
  const qrBorderRadius = data.qrBorderRadius ?? config.qrBorderRadius ?? 24;
  const qrBgColor = data.qrBgColor || config.qrBgColor || (isDark ? '#111115' : '#ffffff');
  const qrPadding = 0; 
  
  const qrSize = data.qrSize || config.qrSize || 90;
  const qrOffsetY = data.qrOffsetY || config.qrOffsetY || 0;

  const cardUrl = generateShareUrl(data);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cardUrl)}&bgcolor=${qrBgColor === 'transparent' ? (isDark ? '0f0f12' : 'ffffff') : qrBgColor.replace('#', '')}&color=${qrColorVal}&margin=0`;

  const getHeaderBackground = () => {
    if (themeType === 'image' && backgroundImage) {
      return { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    } else if (themeType === 'gradient') {
      return { background: themeGradient };
    }
    return { backgroundColor: themeColor };
  };

  const getHeaderStyles = (): React.CSSProperties => {
    const opacity = (config.headerOpacity ?? 100) / 100;
    const isGlassy = config.headerGlassy;
    let baseStyle: React.CSSProperties = { 
      height: `${headerHeight}px`,
      width: '100%',
      position: headerType === 'overlay' ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 0
    };
    
    const bg = getHeaderBackground();
    baseStyle = { ...baseStyle, ...bg };
    
    if (isGlassy) {
      baseStyle = { 
        ...baseStyle, 
        backgroundColor: isDark ? `rgba(15, 15, 20, ${opacity})` : `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
      };
    }

    switch(headerType) {
      case 'curved': baseStyle.clipPath = 'ellipse(100% 100% at 50% 0%)'; break;
      case 'diagonal': baseStyle.clipPath = 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'; break;
      case 'split-left': baseStyle.clipPath = 'polygon(0 0, 100% 0, 100% 60%, 0 100%)'; break;
      case 'split-right': baseStyle.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 60%)'; break;
      case 'wave': baseStyle.clipPath = 'polygon(0% 0%, 100% 0%, 100% 85%, 90% 88%, 80% 90%, 70% 89%, 60% 86%, 50% 84%, 40% 83%, 30% 85%, 20% 88%, 10% 90%, 0% 88%)'; break;
      case 'floating':
        baseStyle.width = 'calc(100% - 32px)';
        baseStyle.margin = '16px auto';
        baseStyle.borderRadius = '32px';
        break;
      case 'glass-card':
        baseStyle.width = 'calc(100% - 48px)';
        baseStyle.margin = '24px auto';
        baseStyle.borderRadius = '40px';
        baseStyle.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
        baseStyle.backdropFilter = 'blur(20px)';
        baseStyle.border = '1px solid rgba(255,255,255,0.1)';
        break;
      case 'modern-split': baseStyle.clipPath = 'polygon(0 0, 100% 0, 75% 100%, 0 100%)'; break;
      case 'side-left':
        baseStyle.width = '15%'; baseStyle.height = '100%'; baseStyle.position = 'absolute'; baseStyle.left = '0'; baseStyle.top = '0';
        break;
      case 'side-right':
        baseStyle.width = '15%'; baseStyle.height = '100%'; baseStyle.position = 'absolute'; baseStyle.right = '0'; baseStyle.top = '0';
        break;
      case 'top-bar': baseStyle.height = '12px'; break;
      case 'minimal': baseStyle.height = '4px'; break;
      case 'hero': baseStyle.height = '350px'; break;
    }

    return baseStyle;
  };

  const ProfileImage = ({ size = 120, circle = false, squircle = false, offsetY = 0, offsetX = 0 }) => {
    const borderRadius = circle ? 'rounded-full' : (squircle ? 'rounded-[22%]' : 'rounded-[28%]');
    const borderWidth = config.avatarBorderWidth ?? 4;
    const borderColor = config.avatarBorderColor || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)');

    return (
      <div className={`relative ${borderRadius} overflow-hidden group shadow-2xl z-30 shrink-0 mx-auto transition-transform duration-500`} 
           style={{ 
             width: `${size}px`, 
             height: `${size}px`, 
             transform: `translate(${offsetX}px, ${offsetY}px)`,
             padding: `${borderWidth}px`,
             backgroundColor: borderColor
           }}>
        <div className={`relative w-full h-full ${borderRadius} overflow-hidden bg-white dark:bg-gray-800 z-10 flex items-center justify-center`}>
          {data.profileImage ? <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} /> : <Camera className="w-1/2 h-1/2 text-gray-400 opacity-40" />}
        </div>
      </div>
    );
  };

  const isOverlay = headerType === 'overlay';
  const baseAvatarOffset = isOverlay ? -(config.avatarSize * 0.6 + 10) : 0;
  const totalAvatarOffsetY = baseAvatarOffset + (config.avatarOffsetY || 0);

  const bodyOpacity = (config.bodyOpacity ?? 100) / 100;
  const bodyBgBase = isDark ? `rgba(18, 18, 21, ${bodyOpacity})` : `rgba(255, 255, 255, ${bodyOpacity})`;
  const bodyRadius = config.bodyBorderRadius !== undefined ? `${config.bodyBorderRadius}px` : '3rem';

  const getBaseMargin = () => {
    if (isOverlay) return (headerHeight * 0.4);
    if (headerType === 'top-bar' || headerType === 'minimal') return 20;
    if (headerType === 'side-left' || headerType === 'side-right') return 40;
    return -60; 
  };

  const shouldShowFloor = isOverlay || config.bodyGlassy || config.bodyOffsetY !== 0 || (config.bodyOpacity ?? 100) < 100;

  const bodyStyles: React.CSSProperties = {
    marginTop: `${getBaseMargin()}px`,
    transform: `translateY(${config.bodyOffsetY || 0}px)`, 
    backgroundColor: shouldShowFloor ? bodyBgBase : 'transparent',
    borderRadius: (shouldShowFloor || config.bodyBorderRadius) ? `${bodyRadius} ${bodyRadius} 0 0` : '0',
    paddingTop: shouldShowFloor ? '20px' : '0',
    position: 'relative',
    zIndex: 20,
    width: (shouldShowFloor) ? 'calc(100% - 32px)' : '100%',
    margin: (shouldShowFloor) ? '0 auto' : '0',
    boxShadow: shouldShowFloor ? '0 -20px 50px -15px rgba(0,0,0,0.15)' : 'none',
    backdropFilter: config.bodyGlassy ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: config.bodyGlassy ? 'blur(20px)' : 'none',
    border: config.bodyGlassy ? (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)') : 'none',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const hasContactButtons = (data.showPhone !== false && data.phone) || (data.showWhatsapp !== false && data.whatsapp) || (!hideSaveButton);
  const shouldShowButtonsContainer = data.showButtons !== false || hasContactButtons;

  const displayOccasionTitle = data.occasionTitle || (isRtl ? data.occasionTitleAr : data.occasionTitleEn) || data.occasionTitleAr || data.occasionTitleEn || '';
  const displayOccasionDesc = data.occasionDesc || config.occasionDesc || '';

  return (
    <div className={`w-full h-full flex flex-col transition-all duration-500 relative overflow-hidden ${isDark ? 'bg-[#0f0f12] text-white' : 'bg-white text-gray-900'}`} style={{ textAlign: config.contentAlign }}>
      <div className="shrink-0 overflow-hidden" style={getHeaderStyles()} />

      <div className="flex flex-col items-center flex-1 px-4 sm:px-6" style={bodyStyles}>
        {(config.avatarStyle !== 'none' || !config.avatarStyle) && (
          <ProfileImage 
            size={config.avatarSize} 
            circle={config.avatarStyle === 'circle'} 
            squircle={config.avatarStyle === 'squircle'}
            offsetY={totalAvatarOffsetY}
            offsetX={config.avatarOffsetX}
          />
        )}

        <div className="w-full space-y-4" style={{ marginTop: isOverlay ? `-${config.avatarSize * 0.4}px` : '20px' }}>
           {data.showName !== false && (
             <h2 className="text-2xl font-black leading-tight" style={{ color: nameColor, transform: `translateY(${config.nameOffsetY}px)`, fontSize: `${config.nameSize}px` }}>
               {data.name || '---'}
             </h2>
           )}

           {(data.showTitle !== false || data.showCompany !== false) && (
             <p className="font-bold opacity-80" style={{ color: titleColor }}>
               {data.showTitle !== false && data.title}
               {(data.showTitle !== false && data.showCompany !== false) && data.company && ' • '}
               {data.showCompany !== false && data.company}
             </p>
           )}

           {data.showBio !== false && data.bio && (
             <div className="p-4 rounded-2xl mx-auto max-w-[300px]" style={{ backgroundColor: bioBgColor, transform: `translateY(${config.bioOffsetY}px)` }}>
               <p className="font-medium leading-relaxed" style={{ color: bioTextColor, fontSize: `${config.bioSize}px` }}>
                 "{data.bio}"
               </p>
             </div>
           )}

           {data.showOccasion !== false && data.occasionDate && (
             <div className={`p-6 rounded-[2.5rem] shadow-xl border relative overflow-hidden mt-6 ${data.occasionFloating !== false ? 'animate-float' : ''}`}
                  style={{ 
                    backgroundColor: data.occasionBgColor || (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    transform: `translateY(${data.occasionOffsetY || 0}px)`
                  }}>
                <PartyPopper className="absolute -top-2 -right-2 opacity-10 rotate-12" size={80} />
                <div className="relative z-10 space-y-2">
                   <h3 className="text-sm font-black uppercase text-center" style={{ color: data.occasionTitleColor || data.occasionPrimaryColor }}>
                     {displayOccasionTitle}
                   </h3>
                   {displayOccasionDesc && (
                     <p className="text-[10px] font-bold text-center opacity-70 leading-relaxed px-4" style={{ color: data.occasionTitleColor || data.occasionPrimaryColor }}>
                       {displayOccasionDesc}
                     </p>
                   )}
                </div>
                {config.showCountdown && <CountdownTimer targetDate={data.occasionDate} isDark={isDark} primaryColor={data.occasionPrimaryColor || '#7c3aed'} />}
                {data.occasionMapUrl && (
                  <a href={data.occasionMapUrl} target="_blank" className="flex items-center justify-center gap-2 mt-6 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105" 
                     style={{ background: data.occasionPrimaryColor }}>
                    <Navigation2 size={14} />
                    {isRtl ? 'موقع المناسبة' : 'Event Location'}
                  </a>
                )}
             </div>
           )}

           <div className="space-y-3 pt-6">
              {data.showEmail !== false && data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-3 justify-center text-sm font-bold opacity-80 hover:opacity-100 transition-opacity" style={{ color: linksColor, transform: `translateY(${config.emailOffsetY || 0}px)` }}>
                  <Mail size={16} /> {data.email}
                </a>
              )}
              {data.showWebsite !== false && data.website && (
                <a href={`https://${data.website}`} target="_blank" className="flex items-center gap-3 justify-center text-sm font-bold opacity-80 hover:opacity-100 transition-opacity" style={{ color: linksColor, transform: `translateY(${config.websiteOffsetY || 0}px)` }}>
                  <Globe size={16} /> {data.website}
                </a>
              )}
           </div>

           {data.showSocialLinks !== false && data.socialLinks?.length > 0 && (
             <div className="flex flex-wrap justify-center gap-3 py-6" style={{ transform: `translateY(${config.socialLinksOffsetY || 0}px)` }}>
               {data.socialLinks.map((link, idx) => (
                 <a key={idx} href={link.url} target="_blank" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:scale-110 transition-all shadow-sm">
                   <SocialIcon platformId={link.platformId} size={20} color={linksColor} />
                 </a>
               ))}
             </div>
           )}

           {shouldShowButtonsContainer && (
              <div className="flex flex-wrap gap-2 justify-center w-full mt-6" style={{ transform: `translateY(${config.contactButtonsOffsetY || 0}px)` }}>
                {data.showPhone !== false && data.phone && (
                  <a href={`tel:${data.phone}`} className={`flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-black text-xs shadow-lg`}>
                    <Phone size={14} /> {t('call')}
                  </a>
                )}
                {data.showWhatsapp !== false && data.whatsapp && (
                  <a href={`https://wa.me/${data.whatsapp}`} target="_blank" className={`flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white font-black text-xs shadow-lg`}>
                    <MessageCircle size={14} /> {t('whatsappBtn')}
                  </a>
                )}
                {!hideSaveButton && data.showButtons !== false && (
                  <button onClick={() => downloadVCard(data)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white font-black text-xs shadow-lg">
                    <UserPlus size={14} /> {t('saveContact')}
                  </button>
                )}
              </div>
           )}

           {data.showQrCode !== false && (
             <div className="pt-10 flex flex-col items-center gap-3" style={{ transform: `translateY(${qrOffsetY}px)` }}>
               <div 
                 className="transition-all duration-500 overflow-hidden"
                 style={{ 
                   border: qrBorderWidth > 0 ? `${qrBorderWidth}px solid ${qrBorderColor}` : 'none',
                   borderRadius: `${qrBorderRadius}px`,
                   padding: `${qrPadding}px`,
                   backgroundColor: qrBgColor === 'transparent' ? 'transparent' : qrBgColor,
                   boxShadow: (qrBgColor !== 'transparent' && !isDark) ? '0 25px 50px -12px rgba(0,0,0,0.15)' : 'none'
                 }}
               >
                  <img 
                    src={qrImageUrl} 
                    alt="QR" 
                    style={{ 
                      width: `${qrSize}px`, 
                      height: `${qrSize}px`,
                      borderRadius: qrPadding > 0 ? `${Math.max(0, qrBorderRadius - qrPadding)}px` : `${qrBorderRadius}px`
                    }} 
                  />
               </div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('showQrCode')}</span>
             </div>
           )}
        </div>
      </div>
      
      <div className="h-24 shrink-0" />
    </div>
  );
};

export default CardPreview;
