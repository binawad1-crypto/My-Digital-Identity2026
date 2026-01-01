
import React, { useState, useRef } from 'react';
import { CustomTemplate, TemplateConfig, Language, CardData } from '../types';
import { TRANSLATIONS, SAMPLE_DATA, THEME_COLORS, THEME_GRADIENTS, BACKGROUND_PRESETS } from '../constants';
import { uploadImageToCloud } from '../services/uploadService';
import CardPreview from './CardPreview';
import { 
  Save, Layout, Smartphone, Layers, Move, Check, X, 
  Zap, AlignCenter, Circle, Box, Loader2, Type as TypographyIcon, 
  Ruler, Star, Hash, ArrowLeft, Palette, Sparkles, ImageIcon, 
  UploadCloud, Sun, Moon, Pipette, Settings, FileText, AlignLeft, 
  AlignRight, LayoutTemplate, Info, Maximize2, UserCircle, Mail, 
  Phone, Globe, MessageCircle, Camera, Download, Tablet, Monitor, 
  Eye, QrCode, Wind, GlassWater, ChevronRight, ChevronLeft, 
  Waves, Square, Columns, Minus, ToggleLeft, ToggleRight, Calendar, MapPin, Timer, PartyPopper, Link as LinkIcon
} from 'lucide-react';

interface TemplateBuilderProps {
  lang: Language;
  onSave: (template: CustomTemplate) => void;
  onCancel?: () => void;
  initialTemplate?: CustomTemplate;
}

type BuilderTab = 'info' | 'header' | 'avatar' | 'visuals' | 'typography' | 'layout' | 'occasion' | 'qrcode';

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ lang, onSave, onCancel, initialTemplate }) => {
  const isRtl = lang === 'ar';
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  const ADMIN_PRESET_COLORS = [
    '#2563eb', '#1e40af', '#3b82f6', '#0ea5e9', '#06b6d4', 
    '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', 
    '#f97316', '#ef4444', '#f43f5e', '#db2777', '#d946ef', 
    '#a855f7', '#7c3aed', '#6366f1', '#4b5563', '#0f172a'
  ];

  const t = (key: string, enVal?: string) => {
    if (enVal) return isRtl ? key : enVal;
    return TRANSLATIONS[key] ? (TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en']) : key;
  };
  
  const [activeTab, setActiveTab] = useState<BuilderTab>('info');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  
  const [template, setTemplate] = useState<CustomTemplate>(initialTemplate || {
    id: `tmpl_${Date.now()}`,
    nameAr: 'قالب جديد مخصص',
    nameEn: 'New Custom Template',
    descAr: '',
    descEn: '',
    isActive: true,
    isFeatured: false,
    order: 0,
    createdAt: new Date().toISOString(),
    config: {
      headerType: 'classic',
      headerHeight: 180,
      avatarStyle: 'circle',
      avatarSize: 120,
      avatarOffsetY: 0,
      avatarOffsetX: 0,
      avatarBorderWidth: 4,
      avatarBorderColor: '#ffffff',
      nameOffsetY: 0,
      bioOffsetY: 0,
      emailOffsetY: 0,
      websiteOffsetY: 0,
      contactButtonsOffsetY: 0,
      socialLinksOffsetY: 0,
      contentAlign: 'center',
      buttonStyle: 'pill',
      animations: 'fade',
      spacing: 'normal',
      nameSize: 26,
      bioSize: 13,
      qrSize: 90,
      qrColor: '#2563eb',
      qrBgColor: 'transparent',
      qrPadding: 0,
      qrOffsetY: 0,
      qrBorderWidth: 4,
      qrBorderColor: '#f9fafb',
      qrBorderRadius: 24,
      showQrCodeByDefault: true,
      showBioByDefault: true,
      showNameByDefault: true,
      showTitleByDefault: true,
      showCompanyByDefault: true,
      showEmailByDefault: true,
      showWebsiteByDefault: true,
      showPhoneByDefault: true,
      showWhatsappByDefault: true,
      showSocialLinksByDefault: true,
      showButtonsByDefault: true,
      showOccasionByDefault: false,
      occasionTitle: 'مناسبة خاصة',
      occasionDesc: '',
      occasionDate: '2025-12-30T12:00',
      occasionMapUrl: '',
      occasionOffsetY: 0,
      occasionFloating: true,
      occasionPrimaryColor: '#7c3aed',
      occasionBgColor: '#ffffff',
      occasionTitleColor: '#111827',
      showCountdown: true,
      headerGlassy: false,
      headerOpacity: 100,
      bodyGlassy: false,
      bodyOpacity: 100,
      bodyOffsetY: 0,
      bodyBorderRadius: 48,
      nameColor: '#111827',
      titleColor: '#2563eb',
      bioTextColor: 'rgba(0,0,0,0.65)',
      bioBgColor: 'rgba(0,0,0,0.03)',
      linksColor: '#3b82f6',
      defaultThemeType: 'gradient',
      defaultThemeColor: '#2563eb',
      defaultThemeGradient: THEME_GRADIENTS[0],
      defaultIsDark: false
    }
  });

  const updateTemplate = (key: keyof CustomTemplate, value: any) => {
    setTemplate(prev => ({ ...prev, [key]: value }));
  };

  const updateConfig = (key: keyof TemplateConfig, value: any) => {
    setTemplate(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, configKey: keyof TemplateConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const base64 = await uploadImageToCloud(file);
      if (base64) {
        updateConfig(configKey, base64);
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const sampleCardData = (SAMPLE_DATA[lang] || SAMPLE_DATA['en']) as CardData;

  const RangeControl = ({ label, value, min, max, onChange, unit = "px", icon: Icon }: any) => (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           {Icon && <Icon size={14} className="text-blue-500" />}
           <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
    </div>
  );

  const ToggleSwitch = ({ label, value, onChange, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:bg-blue-50/10">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-blue-500" />}
        <span className="text-[11px] font-black dark:text-white uppercase tracking-widest">{label}</span>
      </div>
      <button onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-blue-600 shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isRtl ? (value ? 'right-7' : 'right-1') : (value ? 'left-7' : 'left-1')}`} />
      </button>
    </div>
  );

  const ColorPicker = ({ label, value, onChange, compact = false }: any) => (
    <div className={`flex items-center justify-between ${compact ? 'p-2' : 'p-5'} bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-blue-100 dark:hover:border-blue-900/30`}>
      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
         <div className="relative w-9 h-9 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
            <input type="color" value={value?.startsWith('rgba') || !value?.startsWith('#') ? '#3b82f6' : value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
            <div className="w-full h-full" style={{ backgroundColor: value }} />
         </div>
         <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-3 py-2 text-[10px] font-black text-blue-600 w-24 uppercase text-center focus:ring-2 focus:ring-blue-100 outline-none" />
      </div>
    </div>
  );

  const NavItem = ({ id, label, icon: Icon }: { id: BuilderTab, label: string, icon: any }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
      <div className={`p-2 rounded-xl ${activeTab === id ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700'} transition-colors`}><Icon size={18} /></div>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  const PreviewContent = () => (
    <div className="flex flex-col items-center w-full">
      <div className="mb-6 w-full flex items-center justify-between px-4">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('معاينة حية', 'Live Preview')}</span></div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
           <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Smartphone size={16}/></button>
           <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded-lg transition-all ${previewDevice === 'tablet' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Tablet size={16}/></button>
           <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Monitor size={16}/></button>
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out origin-top border-[10px] border-gray-900 dark:border-gray-800 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden bg-white dark:bg-gray-950 ${previewDevice === 'mobile' ? 'w-[320px]' : previewDevice === 'tablet' ? 'w-[440px]' : 'w-[360px]'}`}>
        <div className="no-scrollbar overflow-x-hidden h-[620px] overflow-y-auto">
           <CardPreview 
             data={{ 
               ...sampleCardData, 
               templateId: template.id, 
               themeType: template.config.defaultThemeType || 'gradient', 
               themeColor: template.config.defaultThemeColor || '#2563eb', 
               themeGradient: template.config.defaultThemeGradient || THEME_GRADIENTS[0], 
               backgroundImage: template.config.defaultBackgroundImage || '', 
               profileImage: template.config.defaultProfileImage || '', 
               isDark: template.config.defaultIsDark || false, 
               nameColor: template.config.nameColor, 
               titleColor: template.config.titleColor, 
               bioTextColor: template.config.bioTextColor, 
               bioBgColor: template.config.bioBgColor, 
               linksColor: template.config.linksColor, 
               qrColor: template.config.qrColor, 
               qrBgColor: template.config.qrBgColor,
               qrPadding: template.config.qrPadding,
               qrBorderWidth: template.config.qrBorderWidth,
               qrBorderColor: template.config.qrBorderColor,
               qrBorderRadius: template.config.qrBorderRadius,
               qrSize: template.config.qrSize,
               showName: template.config.showNameByDefault,
               showTitle: template.config.showTitleByDefault,
               showCompany: template.config.showCompanyByDefault,
               showEmail: template.config.showEmailByDefault,
               showWebsite: template.config.showWebsiteByDefault,
               showPhone: template.config.showPhoneByDefault,
               showWhatsapp: template.config.showWhatsappByDefault,
               showSocialLinks: template.config.showSocialLinksByDefault,
               showButtons: template.config.showButtonsByDefault,
               showQrCode: template.config.showQrCodeByDefault, 
               showBio: template.config.showBioByDefault, 
               showOccasion: template.config.showOccasionByDefault,
               occasionTitle: template.config.occasionTitle,
               occasionDesc: template.config.occasionDesc,
               occasionDate: template.config.occasionDate || '2025-12-30T12:00',
               occasionMapUrl: template.config.occasionMapUrl,
               occasionOffsetY: template.config.occasionOffsetY, 
               occasionFloating: template.config.occasionFloating, 
               occasionPrimaryColor: template.config.occasionPrimaryColor, 
               occasionBgColor: template.config.occasionBgColor, 
               occasionTitleColor: template.config.occasionTitleColor 
             }} 
             lang={lang} 
             customConfig={template.config} 
             hideSaveButton={true} 
           />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0a0a0c] rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-100px)] min-h-[850px]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-5">
          <button type="button" onClick={onCancel} className="p-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-xl border border-gray-100 dark:border-gray-700 transition-all shadow-sm"><ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} /></button>
          <div className="flex flex-col"><h2 className="text-base font-black dark:text-white leading-none mb-1">{t('تصميم القالب المخصص', 'Custom Template Design')}</h2><div className="flex items-center gap-1.5"><Hash size={10} className="text-blue-500" /><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{template.id}</span></div></div>
        </div>
        <button onClick={() => onSave(template)} disabled={loading} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-xl flex items-center gap-2">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {t('حفظ القالب', 'Save Template')}</button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-l dark:border-gray-800 p-6 flex flex-col gap-1 overflow-y-auto no-scrollbar shrink-0 bg-gray-50/30 dark:bg-transparent">
          <NavItem id="info" label={t('معلومات عامة', 'Basic Info')} icon={Info} />
          <NavItem id="header" label={t('نمط الترويسة', 'Header Layout')} icon={Layout} />
          <NavItem id="avatar" label={t('الصورة الشخصية', 'Avatar')} icon={Circle} />
          <NavItem id="visuals" label={t('المظهر العام', 'Visual Style')} icon={Palette} />
          <NavItem id="typography" label={t('النصوص والخطوط', 'Typography')} icon={TypographyIcon} />
          <NavItem id="layout" label={t('التموضع والخيارات', 'Layout & Options')} icon={Move} />
          <NavItem id="occasion" label={t('مناسبة خاصة', 'Special Occasion')} icon={PartyPopper} />
          <NavItem id="qrcode" label={t('رمز الـ QR', 'QR Code')} icon={QrCode} />
        </div>

        <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-gray-50/20 dark:bg-transparent">
          <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-32">
            
            {activeTab === 'info' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('الاسم (عربي)', 'Name (AR)')}</label><input type="text" value={template.nameAr} onChange={e => updateTemplate('nameAr', e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-gray-800 border dark:text-white font-bold" /></div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('الاسم (English)', 'Name (EN)')}</label><input type="text" value={template.nameEn} onChange={e => updateTemplate('nameEn', e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-gray-800 border dark:text-white font-bold" /></div>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Move size={20} /></div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white uppercase tracking-widest leading-none mb-1">{isRtl ? 'تحريك وتموضع عناصر البطاقة' : 'Element Positioning'}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'تحكم في إزاحة كل قسم داخل البطاقة' : 'Control the vertical offset of each section'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RangeControl label={t('تحريك الأرضية العامة', 'Main Body Offset')} min={-400} max={600} value={template.config.bodyOffsetY || 0} onChange={(v: number) => updateConfig('bodyOffsetY', v)} icon={Layers} />
                    <RangeControl label={t('زوايا البطاقة', 'Body Radius')} min={0} max={100} value={template.config.bodyBorderRadius !== undefined ? template.config.bodyBorderRadius : 48} onChange={(v: number) => updateConfig('bodyBorderRadius', v)} icon={Box} />
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RangeControl label={t('إزاحة قسم البريد', 'Email Offset')} min={-400} max={400} value={template.config.emailOffsetY || 0} onChange={(v: number) => updateConfig('emailOffsetY', v)} icon={Mail} />
                    <RangeControl label={t('إزاحة قسم الموقع', 'Website Offset')} min={-400} max={400} value={template.config.websiteOffsetY || 0} onChange={(v: number) => updateConfig('websiteOffsetY', v)} icon={Globe} />
                    <RangeControl label={t('إزاحة أيقونات التواصل', 'Social Icons Offset')} min={-400} max={400} value={template.config.socialLinksOffsetY || 0} onChange={(v: number) => updateConfig('socialLinksOffsetY', v)} icon={LinkIcon} />
                    <RangeControl label={t('إزاحة أزرار الاتصال', 'Contact Buttons Offset')} min={-400} max={400} value={template.config.contactButtonsOffsetY || 0} onChange={(v: number) => updateConfig('contactButtonsOffsetY', v)} icon={Phone} />
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                    <ToggleSwitch label={t('نمط زجاجي للبطاقة', 'Glass Effect')} value={template.config.bodyGlassy} onChange={(v: boolean) => updateConfig('bodyGlassy', v)} icon={GlassWater} />
                    <RangeControl label={t('شفافية البطاقة', 'Card Opacity')} min={0} max={100} value={template.config.bodyOpacity ?? 100} onChange={(v: number) => updateConfig('bodyOpacity', v)} unit="%" icon={Sun} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleSwitch label={t('ظهور البريد الإلكتروني', 'Show Email')} value={template.config.showEmailByDefault !== false} onChange={(v: boolean) => updateConfig('showEmailByDefault', v)} icon={Mail} />
                    <ToggleSwitch label={t('ظهور رابط الموقع', 'Show Website')} value={template.config.showWebsiteByDefault !== false} onChange={(v: boolean) => updateConfig('showWebsiteByDefault', v)} icon={Globe} />
                    <ToggleSwitch label={t('ظهور رقم الهاتف', 'Show Phone')} value={template.config.showPhoneByDefault !== false} onChange={(v: boolean) => updateConfig('showPhoneByDefault', v)} icon={Phone} />
                    <ToggleSwitch label={t('ظهور الواتساب', 'Show WhatsApp')} value={template.config.showWhatsappByDefault !== false} onChange={(v: boolean) => updateConfig('showWhatsappByDefault', v)} icon={MessageCircle} />
                    <ToggleSwitch label={t('ظهور روابط التواصل', 'Show Socials')} value={template.config.showSocialLinksByDefault !== false} onChange={(v: boolean) => updateConfig('showSocialLinksByDefault', v)} icon={MessageCircle} />
                    <ToggleSwitch label={t('ظهور أزرار الاتصال', 'Show Buttons')} value={template.config.showButtonsByDefault !== false} onChange={(v: boolean) => updateConfig('showButtonsByDefault', v)} icon={Phone} />
                  </div>
                  
                  <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">{t('محاذاة المحتوى', 'Content Alignment')}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['start', 'center', 'end'].map(align => (
                          <button key={align} onClick={() => updateConfig('contentAlign', align)} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${template.config.contentAlign === align ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                            {align === 'start' ? <AlignLeft size={20}/> : align === 'center' ? <AlignCenter size={20}/> : <AlignRight size={20}/>}
                            <span className="text-[10px] font-black uppercase">{t(align)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">{t('نمط الأزرار', 'Button Style')}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['pill', 'square', 'glass'].map(style => (
                          <button key={style} onClick={() => updateConfig('buttonStyle', style)} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${template.config.buttonStyle === style ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                            <span className="text-[10px] font-black uppercase">{t(style)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <RangeControl label={t('التباعد بين العناصر', 'Spacing')} min={10} max={60} value={template.config.spacing === 'compact' ? 20 : template.config.spacing === 'relaxed' ? 50 : 35} onChange={(v: number) => updateConfig('spacing', v < 30 ? 'compact' : v > 40 ? 'relaxed' : 'normal')} icon={Ruler} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'header' && (
              <div className="space-y-8 animate-fade-in">
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">{t('تخطيط الترويسة (15 نمط متاح)', 'Header Layout (15 Styles Available)')}</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                         {[
                           {id: 'classic', icon: LayoutTemplate, label: 'كلاسيك'},
                           {id: 'overlay', icon: Layers, label: 'متداخل'},
                           {id: 'split-left', icon: ChevronLeft, label: 'منقسم يسار'},
                           {id: 'split-right', icon: ChevronRight, label: 'منقسم يمين'},
                           {id: 'hero', icon: Monitor, label: 'بانورامي'},
                           {id: 'minimal', icon: Zap, label: 'بسيط'},
                           {id: 'curved', icon: Wind, label: 'منحني'},
                           {id: 'diagonal', icon: ChevronRight, label: 'قطري'},
                           {id: 'wave', icon: Waves, label: 'موجي'},
                           {id: 'floating', icon: Square, label: 'عائم'},
                           {id: 'side-left', icon: AlignLeft, label: 'جانبي يسار'},
                           {id: 'side-right', icon: AlignRight, label: 'جانبي يمين'},
                           {id: 'glass-card', icon: GlassWater, label: 'بطاقة زجاجية'},
                           {id: 'modern-split', icon: Columns, label: 'منقسم حديث'},
                           {id: 'top-bar', icon: Minus, label: 'شريط علوي'}
                         ].map(item => (
                           <button key={item.id} onClick={() => updateConfig('headerType', item.id)} className={`py-4 px-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${template.config.headerType === item.id ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'}`}><item.icon size={20}/> <span className="text-[7px] font-black uppercase text-center leading-tight">{t(item.label, item.id)}</span></button>
                         ))}
                      </div>
                    </div>

                    <RangeControl label={t('ارتفاع الترويسة', 'Header Height')} min={60} max={450} value={template.config.headerHeight} onChange={(v: number) => updateConfig('headerHeight', v)} />

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3"><GlassWater className="text-blue-600" size={20} /><h4 className="text-[11px] font-black uppercase tracking-widest dark:text-white">{t('نمط زجاجي للترويسة', 'Header Glassy')}</h4></div>
                          <button onClick={() => updateConfig('headerGlassy', !template.config.headerGlassy)} className={`w-14 h-7 rounded-full relative transition-all ${template.config.headerGlassy ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isRtl ? (template.config.headerGlassy ? 'right-8' : 'right-1') : (template.config.headerGlassy ? 'left-8' : 'left-1')}`} /></button>
                       </div>
                       {template.config.headerGlassy && <RangeControl label={t('شفافية الترويسة', 'Opacity')} min={0} max={100} value={template.config.headerOpacity ?? 100} onChange={(v: number) => updateConfig('headerOpacity', v)} unit="%" />}
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'avatar' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                  <ToggleSwitch label={t('تفعيل ظهور الصورة الشخصية', 'Show Avatar')} value={template.config.avatarStyle !== 'none'} onChange={(v: boolean) => updateConfig('avatarStyle', v ? 'circle' : 'none')} icon={Camera} />
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">{t('شكل الصورة', 'Avatar Shape')}</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['circle', 'squircle', 'none'].map(style => (
                         <button key={style} onClick={() => updateConfig('avatarStyle', style)} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${template.config.avatarStyle === style ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                           {style === 'circle' ? <Circle size={20}/> : style === 'squircle' ? <Box size={20}/> : <X size={20}/>}
                           <span className="text-[10px] font-black uppercase">{t(style)}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <RangeControl label={t('حجم الصورة', 'Avatar Size')} min={60} max={250} value={template.config.avatarSize} onChange={(v: number) => updateConfig('avatarSize', v)} icon={Maximize2} />
                     <RangeControl label={t('سمك الإطار', 'Border Width')} min={0} max={20} value={template.config.avatarBorderWidth ?? 2} onChange={(v: number) => updateConfig('avatarBorderWidth', v)} icon={Ruler} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <RangeControl label={t('إزاحة الرأسية (فوق/تحت)', 'Y Offset')} min={-200} max={200} value={template.config.avatarOffsetY} onChange={(v: number) => updateConfig('avatarOffsetY', v)} icon={Move} />
                     <RangeControl label={t('الإزاحة الأفقية (يمين/شمال)', 'X Offset')} min={-200} max={200} value={template.config.avatarOffsetX} onChange={(v: number) => updateConfig('avatarOffsetX', v)} icon={Move} />
                  </div>

                  <ColorPicker label={t('لون الإطار', 'Border Color')} value={template.config.avatarBorderColor || '#ffffff'} onChange={(v: string) => updateConfig('avatarBorderColor', v)} />
                </div>
              </div>
            )}

            {activeTab === 'visuals' && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">{t('نوع الخلفية الافتراضية', 'Default Background')}</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['color', 'gradient', 'image'].map(type => (
                         <button key={type} onClick={() => updateConfig('defaultThemeType', type)} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 flex-1 ${template.config.defaultThemeType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-[#121215] text-gray-400 border-transparent shadow-sm'}`}>
                           {type === 'color' ? <Palette size={20}/> : type === 'gradient' ? <Sparkles size={20}/> : <ImageIcon size={20}/>}
                           <span className="text-[10px] font-black uppercase tracking-widest">{t(type === 'color' ? 'لون ثابت' : type === 'gradient' ? 'تدرج' : 'صورة', type.toUpperCase())}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  {template.config.defaultThemeType === 'color' && (
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{t('اختر لوناً جاهزاً', 'Select Ready Color')}</label>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {ADMIN_PRESET_COLORS.map((clr, i) => (
                          <button 
                            key={i} 
                            onClick={() => updateConfig('defaultThemeColor', clr)} 
                            className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-125 ${template.config.defaultThemeColor === clr ? 'border-blue-600 scale-125 shadow-lg' : 'border-white dark:border-gray-700'}`} 
                            style={{ backgroundColor: clr }} 
                          />
                        ))}
                      </div>
                      <ColorPicker label={t('أو اختر لوناً مخصصاً', 'Or Custom Color')} value={template.config.defaultThemeColor} onChange={(v: string) => updateConfig('defaultThemeColor', v)} />
                    </div>
                  )}
                  
                  {template.config.defaultThemeType === 'gradient' && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{t('اختر تدرجاً', 'Select Gradient')}</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {THEME_GRADIENTS.map((grad, i) => (
                          <button key={i} onClick={() => updateConfig('defaultThemeGradient', grad)} className={`h-12 rounded-xl border-2 transition-all ${template.config.defaultThemeGradient === grad ? 'border-blue-600 scale-110 shadow-lg' : 'border-transparent opacity-60'}`} style={{ background: grad }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {template.config.defaultThemeType === 'image' && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{t('صورة الخلفية', 'Background Image')}</label>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {BACKGROUND_PRESETS.map((url, i) => (
                          <button key={i} onClick={() => updateConfig('defaultBackgroundImage', url)} className={`h-16 rounded-xl border-2 overflow-hidden transition-all ${template.config.defaultBackgroundImage === url ? 'border-blue-600' : 'border-transparent'}`}><img src={url} className="w-full h-full object-cover" /></button>
                        ))}
                      </div>
                      <button onClick={() => bgInputRef.current?.click()} className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3">
                        {uploadingImg ? <Loader2 className="animate-spin" /> : <UploadCloud size={18} />} {t('رفع صورة مخصصة', 'Upload Custom')}
                      </button>
                      <input type="file" ref={bgInputRef} onChange={(e) => handleFileUpload(e, 'defaultBackgroundImage')} className="hidden" accept="image/*" />
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Moon className="text-gray-400" size={18} /><span className="text-xs font-black dark:text-white uppercase tracking-widest">{t('الوضع الليلي افتراضياً', 'Default Dark Mode')}</span></div>
                    <button onClick={() => updateConfig('defaultIsDark', !template.config.defaultIsDark)} className={`w-14 h-7 rounded-full relative transition-all ${template.config.defaultIsDark ? 'bg-blue-600 shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isRtl ? (template.config.defaultIsDark ? 'right-8' : 'right-1') : (template.config.defaultIsDark ? 'left-8' : 'left-1')}`} /></button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="space-y-6 animate-fade-in">
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="space-y-4">
                       <ToggleSwitch label={t('تفعيل ظهور اسم العميل', 'Show Name')} value={template.config.showNameByDefault !== false} onChange={(v: boolean) => updateConfig('showNameByDefault', v)} icon={UserCircle} />
                       {template.config.showNameByDefault !== false && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-l-2 border-blue-500 pl-4">
                            <div className="md:col-span-2"><ColorPicker label={t('لون اسم العميل', 'Name Color')} value={template.config.nameColor} onChange={(v: string) => updateConfig('nameColor', v)} /></div>
                            <RangeControl label={t('حجم اسم العميل', 'Name Font Size')} min={16} max={50} value={template.config.nameSize} onChange={(v: number) => updateConfig('nameSize', v)} icon={TypographyIcon} />
                            <RangeControl label={t('إزاحة الاسم (فوق/تحت)', 'Name Y Offset')} min={-400} max={400} value={template.config.nameOffsetY} onChange={(v: number) => updateConfig('nameOffsetY', v)} icon={Move} />
                         </div>
                       )}
                    </div>
                    
                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                       <ToggleSwitch label={t('تفعيل ظهور المسمى الوظيفي', 'Show Job Title')} value={template.config.showTitleByDefault !== false} onChange={(v: boolean) => updateConfig('showTitleByDefault', v)} icon={Layers} />
                       {template.config.showTitleByDefault !== false && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-l-2 border-blue-500 pl-4">
                            <ColorPicker label={t('لون المسمى الوظيفي', 'Title Color')} value={template.config.titleColor} onChange={(v: string) => updateConfig('titleColor', v)} />
                            <ToggleSwitch label={t('تفعيل ظهور الشركة', 'Show Company')} value={template.config.showCompanyByDefault !== false} onChange={(v: boolean) => updateConfig('showCompanyByDefault', v)} icon={Box} />
                         </div>
                       )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                       <ToggleSwitch label={t('تفعيل ظهور النبذة التعريفية', 'Show Bio')} value={template.config.showBioByDefault !== false} onChange={(v: boolean) => updateConfig('showBioByDefault', v)} icon={FileText} />
                       {template.config.showBioByDefault !== false && (
                         <div className="space-y-4 animate-fade-in border-l-2 border-blue-500 pl-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <ColorPicker label={t('لون نص النبذة', 'Bio Text Color')} value={template.config.bioTextColor} onChange={(v: string) => updateConfig('bioTextColor', v)} />
                               <ColorPicker label={t('خلفية النبذة', 'Bio Bg Color')} value={template.config.bioBgColor} onChange={(v: string) => updateConfig('bioBgColor', v)} />
                            </div>
                            <RangeControl label={t('حجم النبذة', 'Bio Font Size')} min={10} max={24} value={template.config.bioSize} onChange={(v: number) => updateConfig('bioSize', v)} icon={TypographyIcon} />
                            <RangeControl label={t('إزاحة النبذة', 'Bio Offset')} min={-400} max={400} value={template.config.bioOffsetY} onChange={(v: number) => updateConfig('bioOffsetY', v)} icon={Move} />
                         </div>
                       )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                       <ColorPicker label={t('لون الروابط والبريد', 'Links Color')} value={template.config.linksColor} onChange={(v: string) => updateConfig('linksColor', v)} />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'occasion' && (
              <div className="space-y-6 animate-fade-in">
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <ToggleSwitch label={t('تفعيل قسم المناسبة خاصة', 'Enable Special Occasion')} value={template.config.showOccasionByDefault === true} onChange={(v: boolean) => updateConfig('showOccasionByDefault', v)} icon={PartyPopper} />
                    
                    {template.config.showOccasionByDefault && (
                      <div className="space-y-6 animate-fade-in border-l-2 border-blue-500 pl-4">
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('عنوان المناسبة', 'Occasion Title')}</label>
                            <input type="text" value={template.config.occasionTitle || ''} onChange={e => updateConfig('occasionTitle', e.target.value)} className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:text-white font-bold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('وصف المناسبة', 'Occasion Description')}</label>
                            <textarea value={template.config.occasionDesc || ''} onChange={e => updateConfig('occasionDesc', e.target.value)} className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:text-white font-bold min-h-[80px]" placeholder={t('أدخل شرحاً مختصراً للمناسبة...', 'Enter a brief description...')} />
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('تاريخ المناسبة والوقت', 'Occasion Date & Time')}</label>
                               <input type="datetime-local" value={template.config.occasionDate} onChange={e => updateConfig('occasionDate', e.target.value)} className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:text-white font-bold !py-3 !px-4 min-h-[52px] [direction:ltr] text-right" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{t('رابط خرائط قوقل', 'Google Maps Link')}</label>
                               <input type="url" value={template.config.occasionMapUrl} onChange={e => updateConfig('occasionMapUrl', e.target.value)} placeholder="https://maps.google.com/..." className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:text-white font-bold" />
                            </div>
                         </div>

                         <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ColorPicker label={t('اللون الأساسي', 'Primary Color')} value={template.config.occasionPrimaryColor} onChange={(v: string) => updateConfig('occasionPrimaryColor', v)} compact />
                            <ColorPicker label={t('خلفية البطاقة', 'Card BG')} value={template.config.occasionBgColor} onChange={(v: string) => updateConfig('occasionBgColor', v)} compact />
                            <ColorPicker label={t('لون العنوان', 'Title Color')} value={template.config.occasionTitleColor} onChange={(v: string) => updateConfig('occasionTitleColor', v)} compact />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RangeControl label={t('إزاحة القسم افتراضياً', 'Default Y Offset')} min={-400} max={400} value={template.config.occasionOffsetY || 0} onChange={(v: number) => updateConfig('occasionOffsetY', v)} icon={Move} />
                            <ToggleSwitch label={t('تفعيل تحريك الطفو افتراضياً', 'Default Float')} value={template.config.occasionFloating !== false} onChange={(v: boolean) => updateConfig('occasionFloating', v)} icon={Wind} />
                         </div>

                         <ToggleSwitch label={t('تفعيل عداد تنازلي', 'Enable Countdown')} value={template.config.showCountdown !== false} onChange={(v: boolean) => updateConfig('showCountdown', v)} icon={Timer} />
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'qrcode' && (
              <div className="space-y-6 animate-fade-in">
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <ToggleSwitch label={t('إظهار الباركود افتراضياً', 'Show QR Code')} value={template.config.showQrCodeByDefault !== false} onChange={(v: boolean) => updateConfig('showQrCodeByDefault', v)} icon={QrCode} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                       <ColorPicker label={t('لون الباركود', 'QR Color')} value={template.config.qrColor} onChange={(v: string) => updateConfig('qrColor', v)} />
                       <ColorPicker label={t('لون خلفية الصندوق', 'QR Box BG')} value={template.config.qrBgColor} onChange={(v: string) => updateConfig('qrBgColor', v)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <RangeControl label={t('سُمك الإطار الخارجي', 'Border Width')} min={0} max={20} value={template.config.qrBorderWidth || 0} onChange={(v: number) => updateConfig('qrBorderWidth', v)} icon={Ruler} />
                       <RangeControl label={t('انحناء الحواف', 'Border Radius')} min={0} max={100} value={template.config.qrBorderRadius || 0} onChange={(v: number) => updateConfig('qrBorderRadius', v)} icon={Box} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <RangeControl label={t('حجم الباركود', 'QR Size')} min={30} max={200} value={template.config.qrSize} onChange={(v: number) => updateConfig('qrSize', v)} icon={Maximize2} />
                       <RangeControl label={t('إزاحة الرأسية للباركود', 'Y Offset')} min={-400} max={400} value={template.config.qrOffsetY} onChange={(v: number) => updateConfig('qrOffsetY', v)} icon={Move} />
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>

        <div className="hidden lg:flex w-full lg:w-[480px] bg-gray-50/50 dark:bg-black/40 border-r lg:border-r-0 lg:border-l dark:border-gray-800 p-6 flex flex-col items-center relative overflow-y-auto no-scrollbar scroll-smooth">
           <PreviewContent />
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
