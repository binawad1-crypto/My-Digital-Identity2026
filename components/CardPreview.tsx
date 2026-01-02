
import { Mail, Phone, Globe, MessageCircle, UserPlus, Camera, Download, QrCode, Cpu, Calendar, MapPin, Timer, PartyPopper, Navigation2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CardData, Language, TemplateConfig } from '../types';
import { TRANSLATIONS, PATTERN_PRESETS } from '../constants';
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
      if (!targetDate) return;
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
  const socialIconsColor = data.socialIconsColor || config.socialIconsColor || linksColor;

  const qrColorVal = (data.qrColor || config.qrColor || themeColor || '#000000').replace('#', '');
  const qrBgColor = data.qrBgColor || config.qrBgColor || (isDark ? '#111115' : '#ffffff');
  const qrSize = data.qrSize || config.qrSize || 90;
  const qrBorderWidth = data.qrBorderWidth ?? config.qrBorderWidth ?? 0;
  const qrBorderColor = data.qrBorderColor || config.qrBorderColor || 'transparent';
  const qrBorderRadius = data.qrBorderRadius ?? config.qrBorderRadius ?? 0;
  const qrOffsetY = data.qrOffsetY || config.qrOffsetY || 0;

  const cardUrl = generateShareUrl(data);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cardUrl)}&bgcolor=${qrBgColor === 'transparent' ? (isDark ? '0f0f12' : 'ffffff') : qrBgColor.replace('#', '')}&color=${qrColorVal}&margin=0`;

  const hasContactButtons = (data.showPhone !== false && data.phone) || 
                           (data.showWhatsapp !== false && data.whatsapp) || 
                           (!hideSaveButton && data.showButtons !== false);

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
      zIndex: 0,
      overflow: 'hidden'
    };
    
    if (config.headerCustomAsset) {
      baseStyle = { ...baseStyle, backgroundImage: `url(${config.headerCustomAsset})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    } else if (themeType === 'image' && backgroundImage) {
      baseStyle = { ...baseStyle, backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    } else if (themeType === 'gradient') {
      baseStyle = { ...baseStyle, background: themeGradient };
    } else {
      baseStyle = { ...baseStyle, backgroundColor: themeColor };
    }
    
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
      case 'side-left': baseStyle.width = '25%'; baseStyle.height = '100%'; baseStyle.position = 'absolute'; baseStyle.left = '0'; break;
      case 'side-right': baseStyle.width = '25%'; baseStyle.height = '100%'; baseStyle.position = 'absolute'; baseStyle.right = '0'; break;
      case 'floating': baseStyle.width = 'calc(100% - 32px)'; baseStyle.margin = '16px auto'; baseStyle.borderRadius = '32px'; break;
      case 'glass-card': baseStyle.width = 'calc(100% - 48px)'; baseStyle.margin = '24px auto'; baseStyle.borderRadius = '40px'; baseStyle.backdropFilter = 'blur(20px)'; break;
      case 'modern-split': baseStyle.clipPath = 'polygon(0 0, 100% 0, 75% 100%, 0 100%)'; break;
      case 'top-bar': baseStyle.height = '12px'; break;
      case 'minimal': baseStyle.height = '4px'; break;
      case 'hero': baseStyle.height = '350px'; break;
    }

    return baseStyle;
  };

  const bodyStyles: React.CSSProperties = {
    marginTop: headerType === 'overlay' ? `${headerHeight * 0.4}px` : (headerType.startsWith('side') ? '40px' : '-60px'),
    transform: `translateY(${config.bodyOffsetY || 0}px)`, 
    backgroundColor: config.bodyGlassy ? (isDark ? `rgba(18,18,21,${(config.bodyOpacity ?? 100)/100})` : `rgba(255,255,255,${(config.bodyOpacity ?? 100)/100})`) : (isDark ? '#0f0f12' : '#ffffff'),
    borderRadius: `${config.bodyBorderRadius ?? 48}px ${config.bodyBorderRadius ?? 48}px 0 0`,
    paddingTop: '24px',
    position: 'relative',
    zIndex: 20,
    width: (headerType.startsWith('side') || config.bodyGlassy) ? 'calc(100% - 32px)' : '100%',
    margin: (headerType.startsWith('side') || config.bodyGlassy) ? '0 auto' : '0',
    backdropFilter: config.bodyGlassy ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: config.bodyGlassy ? 'blur(20px)' : 'none',
    border: config.bodyGlassy ? (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)') : 'none',
    textAlign: config.contentAlign || 'center',
    marginLeft: headerType === 'side-left' ? '28%' : (headerType === 'side-right' ? '2%' : 'auto'),
    marginRight: headerType === 'side-right' ? '28%' : (headerType === 'side-left' ? '2%' : 'auto'),
  };

  const displayOccasionTitle = data.occasionTitle || config.occasionTitle || '';
  const displayOccasionDesc = data.occasionDesc || config.occasionDesc || '';
  // تحديد قيمة الإزاحة الرأسية من بيانات البطاقة أو إعدادات القالب
  const occasionVerticalOffset = data.occasionOffsetY !== undefined ? data.occasionOffsetY : (config.occasionOffsetY || 0);

  return (
    <div className={`w-full min-h-full flex flex-col transition-all duration-500 relative overflow-hidden rounded-[2.25rem] ${isDark ? 'bg-[#0f0f12] text-white' : 'bg-white text-gray-900'}`}>
      
      <div className="shrink-0 overflow-hidden relative" style={getHeaderStyles()}>
          {headerType === 'custom-asset' && config.headerSvgRaw && (
             <div className="absolute inset-0 flex items-start justify-center overflow-hidden" style={{ color: themeType === 'gradient' ? '#ffffff' : themeColor, opacity: 0.9 }} dangerouslySetInnerHTML={{ __html: config.headerSvgRaw.replace('<svg', `<svg style="width: 100%; height: 100%; display: block;" preserveAspectRatio="none"`) }} />
          )}
      </div>

      <div className="flex flex-col flex-1 px-4 sm:px-6" style={bodyStyles}>
        {config.avatarStyle !== 'none' && (
          <div className={`relative ${config.avatarStyle === 'circle' ? 'rounded-full' : 'rounded-[28%]'} overflow-hidden shadow-2xl z-30 shrink-0 mx-auto transition-all`} 
               style={{ 
                 width: `${config.avatarSize}px`, height: `${config.avatarSize}px`, 
                 transform: `translate(${config.avatarOffsetX || 0}px, ${config.avatarOffsetY || 0}px)`,
                 padding: `${config.avatarBorderWidth ?? 4}px`, backgroundColor: config.avatarBorderColor || '#ffffff'
               }}>
            <div className={`w-full h-full ${config.avatarStyle === 'circle' ? 'rounded-full' : 'rounded-[22%]'} overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center`}>
              {data.profileImage ? <img src={data.profileImage} className="w-full h-full object-cover" /> : <Camera size={40} className="text-gray-200" />}
            </div>
          </div>
        )}

        <div className={`w-full ${config.spacing === 'compact' ? 'space-y-2' : config.spacing === 'relaxed' ? 'space-y-6' : 'space-y-4'}`} style={{ marginTop: headerType === 'overlay' ? '20px' : '24px' }}>
           {data.showName !== false && (
             <h2 className="font-black leading-tight" style={{ color: nameColor, transform: `translateY(${config.nameOffsetY}px)`, fontSize: `${config.nameSize}px` }}>
               {data.name || '---'}
             </h2>
           )}

           {(data.showTitle !== false || data.showCompany !== false) && (
             <p className="font-bold opacity-80" style={{ color: titleColor, transform: `translateY(${config.titleOffsetY || 0}px)`, fontSize: '14px' }}>
               {data.showTitle !== false && data.title}
               {(data.showTitle !== false && data.showCompany !== false) && data.company && ' • '}
               {data.showCompany !== false && data.company}
             </p>
           )}

           {data.showBio !== false && data.bio && (
             <div className="p-4 rounded-2xl mx-auto" style={{ backgroundColor: bioBgColor, transform: `translateY(${config.bioOffsetY}px)`, maxWidth: '90%' }}>
               <p className="font-medium leading-relaxed" style={{ color: bioTextColor, fontSize: `${config.bioSize}px` }}>
                 "{data.bio}"
               </p>
             </div>
           )}

           {/* قسم المناسبة الخاصة - تم فصل حاوية الإزاحة عن حاوية التحريك */}
           {data.showOccasion !== false && (data.occasionDate || config.occasionDate) && (
             <div style={{ transform: `translateY(${occasionVerticalOffset}px)` }} className="w-full transition-transform duration-300">
               <div className={`p-6 rounded-[2.5rem] shadow-xl border relative overflow-hidden mt-6 ${data.occasionFloating !== false ? 'animate-float' : ''}`}
                    style={{ 
                      backgroundColor: data.occasionBgColor || config.occasionBgColor || (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    }}>
                  <div className="relative z-10 space-y-2">
                     <h3 className="text-sm font-black uppercase text-center" style={{ color: data.occasionTitleColor || config.occasionTitleColor || data.occasionPrimaryColor || config.occasionPrimaryColor }}>
                       {displayOccasionTitle}
                     </h3>
                     {displayOccasionDesc && (
                       <p className="text-[10px] font-bold text-center opacity-70 px-4" style={{ color: data.occasionTitleColor || config.occasionTitleColor }}>
                         {displayOccasionDesc}
                       </p>
                     )}
                  </div>
                  {(config.showCountdown || data.showOccasion) && (data.occasionDate || config.occasionDate) && (
                     <CountdownTimer targetDate={data.occasionDate || config.occasionDate || ''} isDark={isDark} primaryColor={data.occasionPrimaryColor || config.occasionPrimaryColor || '#7c3aed'} />
                  )}
                  {(data.occasionMapUrl || config.occasionMapUrl) && (
                    <a href={data.occasionMapUrl || config.occasionMapUrl} target="_blank" className="flex items-center justify-center gap-2 mt-6 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105" 
                       style={{ background: data.occasionPrimaryColor || config.occasionPrimaryColor }}>
                      <Navigation2 size={14} />
                      {isRtl ? 'موقع المناسبة' : 'Event Location'}
                    </a>
                  )}
               </div>
             </div>
           )}

           <div className="space-y-3 pt-4">
              {data.showEmail !== false && data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-3 justify-center text-sm font-bold opacity-80" style={{ color: linksColor, transform: `translateY(${config.emailOffsetY || 0}px)` }}>
                  <Mail size={16} /> {data.email}
                </a>
              )}
              {data.showWebsite !== false && data.website && (
                <a href={data.website} target="_blank" className="flex items-center gap-3 justify-center text-sm font-bold opacity-80" style={{ color: linksColor, transform: `translateY(${config.websiteOffsetY || 0}px)` }}>
                  <Globe size={16} /> {data.website}
                </a>
              )}
           </div>

           {data.showSocialLinks !== false && data.socialLinks?.length > 0 && (
             <div className="flex flex-wrap justify-center gap-3 py-4" style={{ transform: `translateY(${config.socialLinksOffsetY || 0}px)` }}>
               {data.socialLinks.map((link, idx) => (
                 <a key={idx} href={link.url} target="_blank" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:scale-110 transition-all shadow-sm">
                   <SocialIcon platformId={link.platformId} size={20} color={socialIconsColor} />
                 </a>
               ))}
             </div>
           )}

           {hasContactButtons && (
              <div className="flex flex-row items-center justify-center gap-2 w-full mt-4 px-1" style={{ transform: `translateY(${config.contactButtonsOffsetY || 0}px)` }}>
                {data.showPhone !== false && data.phone && (
                  <a href={`tel:${data.phone}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-4 rounded-full bg-blue-600 text-white font-black text-[10px] shadow-lg">
                    <Phone size={14} /> {t('call')}
                  </a>
                )}
                {data.showWhatsapp !== false && data.whatsapp && (
                  <a href={`https://wa.me/${data.whatsapp}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 px-3 py-4 rounded-full bg-emerald-500 text-white font-black text-[10px] shadow-lg">
                    <MessageCircle size={14} /> {t('whatsappBtn')}
                  </a>
                )}
                {!hideSaveButton && data.showButtons !== false && (
                  <button onClick={() => downloadVCard(data)} className="flex-1 flex items-center justify-center gap-3 px-3 py-4 rounded-full bg-gray-900 text-white font-black text-[10px] shadow-lg">
                    <UserPlus size={14} /> {t('saveContact')}
                  </button>
                )}
              </div>
           )}

           {/* قسم الباركود */}
           {data.showQrCode !== false && (
             <div className="pt-8 flex flex-col items-center gap-3" style={{ transform: `translateY(${qrOffsetY}px)` }}>
               <div className="transition-all duration-500 overflow-hidden" 
                    style={{ 
                      border: `${qrBorderWidth}px solid ${qrBorderColor}`, 
                      borderRadius: `${qrBorderRadius}px`, 
                      padding: `${config.qrPadding || 0}px`, 
                      backgroundColor: qrBgColor === 'transparent' ? 'transparent' : qrBgColor 
                    }}>
                  <img src={qrImageUrl} alt="QR" style={{ width: `${qrSize}px`, height: `${qrSize}px` }} />
               </div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('showQrCode')}</span>
             </div>
           )}
        </div>
      </div>
      <div className="h-20 shrink-0" />
    </div>
  );
};

export default CardPreview;
