
import React, { useState, useEffect, useRef } from 'react';
import { CardData, Language, SocialLink, CustomTemplate } from '../types';
import { TRANSLATIONS, THEME_COLORS, THEME_GRADIENTS, SOCIAL_PLATFORMS, SAMPLE_DATA, BACKGROUND_PRESETS } from '../constants';
import { generateProfessionalBio } from '../services/geminiService';
import { generateSerialId } from '../utils/share';
import { isSlugAvailable, auth } from '../services/firebase';
import { uploadImageToCloud } from '../services/uploadService';
import CardPreview from '../components/CardPreview';
import SocialIcon from '../components/SocialIcon';
import { 
  Save, Plus, X, Loader2, Sparkles, Moon, Sun, Hash, 
  Mail, Phone, Globe, MessageCircle, Link as LinkIcon, 
  CheckCircle2, AlertCircle, UploadCloud, ImageIcon, 
  Palette, Layout, User as UserIcon, Camera, Share2, 
  Pipette, Type as TypographyIcon, Smartphone, Tablet, Monitor, Eye, ArrowLeft, QrCode, RefreshCcw, FileText, Calendar, MapPin, PartyPopper, Move, Wind, ChevronRight, Info, Settings, LayoutGrid, ToggleLeft, ToggleRight, EyeOff, Ruler, Box, Maximize2
} from 'lucide-react';

interface EditorProps {
  lang: Language;
  onSave: (data: CardData, oldId?: string) => void;
  onCancel: () => void;
  initialData?: CardData;
  isAdminEdit?: boolean;
  templates: CustomTemplate[];
  forcedTemplateId?: string; 
}

type EditorTab = 'identity' | 'social' | 'design' | 'occasion';

// Fix: Added missing occasion tab content, closing tags, and default export
const Editor: React.FC<EditorProps> = ({ lang, onSave, onCancel, initialData, isAdminEdit, templates, forcedTemplateId }) => {
  const isRtl = lang === 'ar';
  const t = (key: string, fallback?: string) => {
    if (fallback && !TRANSLATIONS[key]) return isRtl ? key : fallback;
    return TRANSLATIONS[key] ? (TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en']) : key;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const originalIdRef = useRef<string | null>(initialData?.id || null);

  const [activeTab, setActiveTab] = useState<EditorTab>('identity');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  const [formData, setFormData] = useState<CardData>(() => {
    const targetTemplateId = initialData?.templateId || forcedTemplateId || templates[0]?.id || 'classic';
    const selectedTmpl = templates.find(t => t.id === targetTemplateId);
    
    if (initialData) return initialData;

    const baseData = { ...(SAMPLE_DATA[lang] || SAMPLE_DATA['en']), id: generateSerialId(), templateId: targetTemplateId } as CardData;

    if (selectedTmpl) {
       return {
         ...baseData,
         templateId: targetTemplateId,
         themeType: selectedTmpl.config.defaultThemeType || baseData.themeType,
         themeColor: selectedTmpl.config.defaultThemeColor || baseData.themeColor,
         themeGradient: selectedTmpl.config.defaultThemeGradient || baseData.themeGradient,
         backgroundImage: selectedTmpl.config.defaultBackgroundImage || baseData.backgroundImage,
         isDark: selectedTmpl.config.defaultIsDark ?? baseData.isDark,
         nameColor: selectedTmpl.config.nameColor || baseData.nameColor,
         titleColor: selectedTmpl.config.titleColor || baseData.titleColor,
         linksColor: selectedTmpl.config.linksColor || baseData.linksColor,
         socialIconsColor: selectedTmpl.config.socialIconsColor || selectedTmpl.config.linksColor || baseData.linksColor,
         contactPhoneColor: selectedTmpl.config.contactPhoneColor || '#2563eb',
         contactWhatsappColor: selectedTmpl.config.contactWhatsappColor || '#10b981',
         qrColor: selectedTmpl.config.qrColor || baseData.qrColor,
         qrBgColor: selectedTmpl.config.qrBgColor || 'transparent',
         qrPadding: 0,
         qrBorderWidth: selectedTmpl.config.qrBorderWidth || 0,
         qrBorderColor: selectedTmpl.config.qrBorderColor || '#ffffff',
         qrBorderRadius: selectedTmpl.config.qrBorderRadius ?? 0, 
         qrSize: selectedTmpl.config.qrSize || 90,
         showName: selectedTmpl.config.showNameByDefault ?? true,
         showTitle: selectedTmpl.config.showTitleByDefault ?? true,
         showCompany: selectedTmpl.config.showCompanyByDefault ?? true,
         showBio: selectedTmpl.config.showBioByDefault ?? true,
         showEmail: selectedTmpl.config.showEmailByDefault ?? true,
         showWebsite: selectedTmpl.config.showWebsiteByDefault ?? true,
         showSocialLinks: selectedTmpl.config.showSocialLinksByDefault ?? true,
         showButtons: selectedTmpl.config.showButtonsByDefault ?? true,
         showQrCode: selectedTmpl.config.showQrCodeByDefault ?? true,
         showOccasion: selectedTmpl.config.showOccasionByDefault ?? false,
         occasionTitle: selectedTmpl.config.occasionTitle || '',
         occasionDesc: selectedTmpl.config.occasionDesc || '',
         occasionDate: selectedTmpl.config.occasionDate || '',
         occasionMapUrl: selectedTmpl.config.occasionMapUrl || '',
         occasionPrimaryColor: selectedTmpl.config.occasionPrimaryColor || '#7c3aed',
         occasionBgColor: selectedTmpl.config.occasionBgColor || '',
         occasionTitleColor: selectedTmpl.config.occasionTitleColor || '',
         occasionOffsetY: selectedTmpl.config.occasionOffsetY || 0,
         occasionFloating: selectedTmpl.config.occasionFloating ?? true
       } as CardData;
    }
    return baseData;
  });

  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [socialInput, setSocialInput] = useState({ platformId: SOCIAL_PLATFORMS[0].id, url: '' });

  const currentTemplate = templates.find(t => t.id === formData.templateId);

  const handleChange = (field: keyof CardData, value: any) => {
    if (field === 'id') { value = (value || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); }
    if (field === 'templateId') {
      const newTmpl = templates.find(t => t.id === value);
      if (newTmpl) {
        setFormData(prev => ({
          ...prev,
          templateId: value,
          nameColor: newTmpl.config.nameColor || prev.nameColor,
          titleColor: newTmpl.config.titleColor || prev.titleColor,
          linksColor: newTmpl.config.linksColor || prev.linksColor,
          socialIconsColor: newTmpl.config.socialIconsColor || newTmpl.config.linksColor || prev.socialIconsColor,
          contactPhoneColor: newTmpl.config.contactPhoneColor || prev.contactPhoneColor,
          contactWhatsappColor: newTmpl.config.contactWhatsappColor || prev.contactWhatsappColor,
          qrColor: newTmpl.config.qrColor || prev.qrColor,
          qrBgColor: newTmpl.config.qrBgColor || prev.qrBgColor,
          qrPadding: newTmpl.config.qrPadding ?? prev.qrPadding,
          qrBorderWidth: newTmpl.config.qrBorderWidth || prev.qrBorderWidth,
          qrBorderColor: newTmpl.config.qrBorderColor || prev.qrBorderColor,
          qrBorderRadius: newTmpl.config.qrBorderRadius ?? 0,
          qrSize: newTmpl.config.qrSize || prev.qrSize,
          themeType: newTmpl.config.defaultThemeType || prev.themeType,
          themeColor: newTmpl.config.defaultThemeColor || prev.themeColor,
          themeGradient: newTmpl.config.defaultThemeGradient || prev.themeGradient,
          backgroundImage: newTmpl.config.defaultBackgroundImage || prev.backgroundImage,
          isDark: newTmpl.config.defaultIsDark ?? prev.isDark,
          showName: newTmpl.config.showNameByDefault ?? prev.showName,
          showTitle: newTmpl.config.showTitleByDefault ?? prev.showTitle,
          showCompany: newTmpl.config.showCompanyByDefault ?? prev.showCompany,
          showBio: newTmpl.config.showBioByDefault ?? prev.showBio,
          showEmail: newTmpl.config.showEmailByDefault ?? prev.showEmail,
          showWebsite: newTmpl.config.showWebsiteByDefault ?? prev.showWebsite,
          showSocialLinks: newTmpl.config.showSocialLinksByDefault ?? prev.showSocialLinks,
          showButtons: newTmpl.config.showButtonsByDefault ?? prev.showButtons,
          showQrCode: newTmpl.config.showQrCodeByDefault ?? prev.showQrCode,
          showOccasion: newTmpl.config.showOccasionByDefault ?? prev.showOccasion,
          occasionTitle: newTmpl.config.occasionTitle || prev.occasionTitle,
          occasionDesc: newTmpl.config.occasionDesc || prev.occasionDesc,
          occasionDate: newTmpl.config.occasionDate || prev.occasionDate,
          occasionMapUrl: newTmpl.config.occasionMapUrl || prev.occasionMapUrl,
          occasionPrimaryColor: newTmpl.config.occasionPrimaryColor || prev.occasionPrimaryColor,
          occasionBgColor: newTmpl.config.occasionBgColor || prev.occasionBgColor,
          occasionTitleColor: newTmpl.config.occasionTitleColor || prev.occasionTitleColor,
          occasionOffsetY: newTmpl.config.occasionOffsetY || prev.occasionOffsetY,
          occasionFloating: newTmpl.config.occasionFloating ?? prev.occasionFloating
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const VisibilityToggle = ({ field, label }: { field: keyof CardData, label: string }) => {
    const isVisible = formData[field] !== false;
    return (
      <button 
        onClick={() => handleChange(field, !isVisible)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${isVisible ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}
        title={isVisible ? t('ظاهر', 'Visible') : t('مخفي', 'Hidden')}
      >
        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        <span className="text-[10px] font-black uppercase tracking-tighter">{isVisible ? t('إظهار', 'Show') : t('إخفاء', 'Hide')}</span>
      </button>
    );
  };

  const handleGenerateBio = async () => {
    if (!formData.name || !formData.title) return;
    setIsGeneratingBio(true);
    try {
      const bio = await generateProfessionalBio(formData.name, formData.title, formData.company, "", lang);
      if (bio) handleChange('bio', bio);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try { const b = await uploadImageToCloud(file); if (b) handleChange('profileImage', b); } finally { setIsUploading(false); }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploadingBg(true);
    try { const b = await uploadImageToCloud(file); if (b) handleChange('backgroundImage', b); } finally { setIsUploadingBg(false); }
  };

  const addSocialLink = () => {
    if (!socialInput.url) return;
    const platform = SOCIAL_PLATFORMS.find(p => p.id === socialInput.platformId);
    if (!platform) return;
    setFormData(prev => ({ 
      ...prev, 
      socialLinks: [...(prev.socialLinks || []), { platform: platform.name, url: socialInput.url, platformId: platform.id }] 
    }));
    setSocialInput({ ...socialInput, url: '' });
  };

  const removeSocialLink = (index: number) => {
    const updated = [...formData.socialLinks];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, socialLinks: updated }));
  };

  const TabButton = ({ id, label, icon: Icon }: { id: EditorTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-widest transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]' : 'bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-100 dark:border-gray-800'}`}
    >
      <Icon size={16} className="shrink-0" /> <span className="truncate">{label}</span>
    </button>
  );

  const inputClasses = "w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all font-bold text-sm shadow-inner";
  const labelClasses = "block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest px-1";

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 w-full space-y-8 pb-32">
          <div className="flex w-full bg-white/80 dark:bg-black/40 p-1.5 rounded-[1.8rem] sm:rounded-[2rem] border border-gray-200/50 dark:border-gray-800/50 sticky top-[75px] z-50 backdrop-blur-md shadow-lg shadow-black/5 gap-1.5 sm:gap-2">
            <TabButton id="identity" label={t('الهوية', 'Identity')} icon={UserIcon} />
            <TabButton id="social" label={t('التواصل', 'Contact')} icon={MessageCircle} />
            <TabButton id="design" label={t('التصميم', 'Design')} icon={Palette} />
            <TabButton id="occasion" label={t('المناسبة', 'Event')} icon={PartyPopper} />
          </div>

          <div className="bg-white dark:bg-[#121215] p-6 md:p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
            
            {activeTab === 'identity' && (
              <div className="space-y-10 animate-fade-in relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start border-b border-gray-50 dark:border-gray-800/50 pb-10">
                   <div className="relative shrink-0 group">
                      <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
                        {formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-gray-200" />}
                        {isUploading && <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-95"><Camera size={18} /></button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                   </div>
                   <div className="flex-1 w-full space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <label className={labelClasses}>{t('الاسم الكامل', 'Full Name')}</label>
                              <VisibilityToggle field="showName" label="Name" />
                            </div>
                            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inputClasses} placeholder="John Doe" />
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <label className={labelClasses}>{t('المسمى الوظيفي', 'Job Title')}</label>
                              <VisibilityToggle field="showTitle" label="Title" />
                            </div>
                            <input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} className={inputClasses} placeholder="Product Designer" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <label className={labelClasses}>{t('الشركة / المنظمة', 'Company')}</label>
                            <VisibilityToggle field="showCompany" label="Company" />
                         </div>
                         <input type="text" value={formData.company} onChange={e => handleChange('company', e.target.value)} className={inputClasses} placeholder="Google Inc." />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <label className={labelClasses}>{t('النبذة التعريفية (Bio)', 'Professional Bio')}</label>
                        <VisibilityToggle field="showBio" label="Bio" />
                      </div>
                      <button 
                        onClick={handleGenerateBio} 
                        disabled={isGeneratingBio || !formData.name}
                        className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30"
                      >
                        {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {t('توليد بالذكاء الاصطناعي', 'AI Generate')}
                      </button>
                   </div>
                   <textarea 
                     value={formData.bio} 
                     onChange={e => handleChange('bio', e.target.value)} 
                     className={`${inputClasses} min-h-[120px] resize-none leading-relaxed`} 
                     placeholder={t('اكتب نبذة مهنية قصيرة تعبر عنك...', 'Write a brief professional summary about yourself...')}
                   />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-8 animate-fade-in relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10 border-b border-gray-50 dark:border-gray-800/50">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className={labelClasses}>{t('البريد الإلكتروني', 'Email')}</label>
                        <VisibilityToggle field="showEmail" label="Email" />
                      </div>
                      <div className="relative">
                        <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                        <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={`${inputClasses} ${isRtl ? 'pr-12' : 'pl-12'}`} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className={labelClasses}>{t('رقم الهاتف', 'Phone')}</label>
                        <VisibilityToggle field="showPhone" label="Phone" />
                      </div>
                      <div className="relative">
                        <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-blue-500`} size={18} />
                        <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className={`${inputClasses} ${isRtl ? 'pr-12' : 'pl-12'}`} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className={labelClasses}>{t('رابط الموقع', 'Website')}</label>
                        <VisibilityToggle field="showWebsite" label="Website" />
                      </div>
                      <div className="relative">
                        <Globe className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-blue-500`} size={18} />
                        <input type="text" value={formData.website} onChange={e => handleChange('website', e.target.value)} className={`${inputClasses} ${isRtl ? 'pr-12' : 'pl-12'}`} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className={labelClasses}>{t('رقم الواتساب', 'WhatsApp')}</label>
                        <VisibilityToggle field="showWhatsapp" label="WhatsApp" />
                      </div>
                      <div className="relative">
                        <MessageCircle className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-emerald-500`} size={18} />
                        <input type="text" value={formData.whatsapp} onChange={e => handleChange('whatsapp', e.target.value)} className={`${inputClasses} ${isRtl ? 'pr-12' : 'pl-12'} text-right`} />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center px-1">
                      <h4 className={labelClasses}>{t('إضافة روابط التواصل الاجتماعي', 'Add Social Media Links')}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('رؤية الروابط', 'Socials Visibility')}</span>
                        <VisibilityToggle field="showSocialLinks" label="Socials" />
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <select 
                        value={socialInput.platformId} 
                        onChange={e => setSocialInput({...socialInput, platformId: e.target.value})}
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <div className="flex-1 relative">
                        <LinkIcon className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-300`} size={16} />
                        <input 
                          type="url" 
                          value={socialInput.url} 
                          onChange={e => setSocialInput({...socialInput, url: e.target.value})} 
                          className={`${inputClasses} ${isRtl ? 'pr-12' : 'pl-12'} !py-3`} 
                          placeholder="https://..."
                        />
                      </div>
                      <button onClick={addSocialLink} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Plus size={18} /> {t('إضافة', 'Add')}
                      </button>
                   </div>

                   <div className="flex flex-wrap gap-3 mt-4">
                      {formData.socialLinks?.map((link, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border dark:border-gray-700 group hover:border-blue-200 transition-all shadow-sm">
                           <SocialIcon platformId={link.platformId} size={16} />
                           <span className="text-[10px] font-bold truncate max-w-[100px]">{link.platform}</span>
                           <button onClick={() => removeSocialLink(i)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                        </div>
                      ))}
                   </div>

                   <div className="pt-8 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-black dark:text-white uppercase leading-none mb-1">{t('أزرار الاتصال السريع', 'Quick Contact Buttons')}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('اتصال، واتساب، حفظ جهة الاتصال', 'Call, WhatsApp, Save Contact')}</span>
                      </div>
                      <VisibilityToggle field="showButtons" label="Contact Buttons" />
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-12 animate-fade-in relative z-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3 px-1">
                      <Layout className="text-blue-600" size={20} />
                      <label className={labelClasses.replace('mb-2', 'mb-0')}>{t('اختر نمط القالب الهيكلي', 'Choose Template Layout')}</label>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {templates.map(tmpl => (
                        <button 
                          key={tmpl.id} 
                          onClick={() => handleChange('templateId', tmpl.id)}
                          className={`relative p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${formData.templateId === tmpl.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.03]' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-blue-100'}`}
                        >
                           <div className={`p-3 rounded-2xl ${formData.templateId === tmpl.id ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-700'} transition-colors`}>
                              <LayoutGrid size={24} className={formData.templateId === tmpl.id ? 'text-white' : 'text-gray-300 group-hover:text-blue-500'} />
                           </div>
                           <span className="text-[9px] font-black uppercase text-center leading-tight">{isRtl ? tmpl.nameAr : tmpl.nameEn}</span>
                           {formData.templateId === tmpl.id && <div className="absolute top-2 right-2 p-1 bg-white rounded-lg"><CheckCircle2 size={12} className="text-blue-600" /></div>}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="pt-10 border-t border-gray-50 dark:border-gray-800/50 space-y-8">
                   <div className="flex items-center gap-3 px-1">
                      <ImageIcon className="text-blue-600" size={20} />
                      <h4 className={labelClasses.replace('mb-2', 'mb-0')}>{t('نمط السمة والخلفية', 'Theme Style & Background')}</h4>
                   </div>

                   <div className="grid grid-cols-3 gap-3 bg-gray-100/50 dark:bg-black/20 p-2 rounded-[2rem]">
                      {['color', 'gradient', 'image'].map(type => (
                        <button 
                          key={type} 
                          onClick={() => handleChange('themeType', type)}
                          className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 flex-1 ${formData.themeType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border-transparent shadow-sm'}`}
                        >
                          {type === 'color' ? <Palette size={20}/> : type === 'gradient' ? <Sparkles size={20}/> : <ImageIcon size={20}/>}
                          <span className="text-[10px] font-black uppercase tracking-widest">{t(type === 'color' ? 'لون ثابت' : type === 'gradient' ? 'تدرج' : 'صورة', type.toUpperCase())}</span>
                        </button>
                      ))}
                   </div>

                   {formData.themeType === 'color' && (
                     <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] space-y-6 animate-fade-in border border-gray-100 dark:border-gray-700 shadow-inner">
                        <label className={labelClasses}>{t('اختر لون السمة', 'Select Theme Color')}</label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                           {THEME_COLORS.map((clr, i) => (
                             <button key={i} onClick={() => handleChange('themeColor', clr)} className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-125 ${formData.themeColor === clr ? 'border-blue-600 scale-125 shadow-lg' : 'border-white dark:border-gray-600'}`} style={{ backgroundColor: clr }} />
                           ))}
                           <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-dashed border-gray-300 group">
                             <input type="color" value={formData.themeColor} onChange={e => handleChange('themeColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                             <div className="w-full h-full flex items-center justify-center bg-white"><Pipette size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" /></div>
                           </div>
                        </div>
                     </div>
                   )}

                   {formData.themeType === 'gradient' && (
                     <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] space-y-6 animate-fade-in border border-gray-100 dark:border-gray-700 shadow-inner">
                        <label className={labelClasses}>{t('اختر التدرج اللوني المفضل', 'Select Gradient Preset')}</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[220px] overflow-y-auto no-scrollbar p-1">
                           {THEME_GRADIENTS.map((grad, i) => (
                             <button key={i} onClick={() => handleChange('themeGradient', grad)} className={`h-14 rounded-2xl border-2 transition-all ${formData.themeGradient === grad ? 'border-blue-600 scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ background: grad }} />
                           ))}
                        </div>
                     </div>
                   )}

                   {formData.themeType === 'image' && (
                     <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] space-y-6 animate-fade-in border border-gray-100 dark:border-gray-700 shadow-inner">
                        <label className={labelClasses}>{t('اختر خلفية فنية أو ارفع صورتك', 'Artistic Backgrounds')}</label>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                           {BACKGROUND_PRESETS.map((url, i) => (
                             <button key={i} onClick={() => handleChange('backgroundImage', url)} className={`h-20 rounded-2xl border-2 overflow-hidden transition-all ${formData.backgroundImage === url ? 'border-blue-600 scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}><img src={url} className="w-full h-full object-cover" /></button>
                           ))}
                        </div>
                        <button onClick={() => bgFileInputRef.current?.click()} className="w-full py-5 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 text-blue-600 rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-sm">
                           {isUploadingBg ? <Loader2 className="animate-spin" /> : <UploadCloud size={18} />} {t('رفع صورة خلفية خاصة', 'Upload Custom Background')}
                        </button>
                        <input type="file" ref={bgFileInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
                     </div>
                   )}
                </div>

                <div className="pt-10 border-t border-gray-50 dark:border-gray-800/50 space-y-8">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <TypographyIcon className="text-blue-600" size={20} />
                        <h4 className="text-[11px] font-black uppercase dark:text-white tracking-widest">{t('تخصيص ألوان الخطوط والعناصر', 'Typography & UI Colors')}</h4>
                   </div>
                      <button onClick={() => handleChange('templateId', formData.templateId)} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl hover:bg-blue-100 transition-all shadow-sm"><RefreshCcw size={12}/> {t('استعادة ألوان القالب', 'Reset Colors')}</button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون الاسم', 'Name Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.nameColor} onChange={e => handleChange('nameColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.nameColor }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.nameColor}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون المسمى', 'Title Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.titleColor} onChange={e => handleChange('titleColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.titleColor }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.titleColor}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون الروابط', 'Links Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.linksColor} onChange={e => handleChange('linksColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.linksColor }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.linksColor}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون أيقونات التواصل', 'Social Icons Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.socialIconsColor || formData.linksColor} onChange={e => handleChange('socialIconsColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.socialIconsColor || formData.linksColor }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.socialIconsColor || formData.linksColor}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون زر الاتصال', 'Phone Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.contactPhoneColor || '#2563eb'} onChange={e => handleChange('contactPhoneColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.contactPhoneColor || '#2563eb' }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.contactPhoneColor || '#2563eb'}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون زر واتساب', 'WhatsApp Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.contactWhatsappColor || '#10b981'} onChange={e => handleChange('contactWhatsappColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.contactWhatsappColor || '#10b981' }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.contactWhatsappColor || '#10b981'}</span>
                         </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                         <label className={labelClasses}>{t('لون الباركود', 'QR Code Color')}</label>
                         <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                              <input type="color" value={formData.qrColor || '#000000'} onChange={e => handleChange('qrColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                              <div className="w-full h-full" style={{ backgroundColor: formData.qrColor || '#000000' }} />
                            </div>
                            <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.qrColor || '#000000'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-10 bg-gray-50 dark:bg-gray-800 rounded-[3rem] space-y-8 border border-gray-100 dark:border-gray-700 shadow-inner">
                      <div className="flex items-center gap-3">
                        <QrCode className="text-blue-600" size={20} />
                        <h4 className="text-[11px] font-black uppercase dark:text-white tracking-widest">{t('تخصيص إطار الباركود', 'QR Border Customization')}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-4">
                            <label className={labelClasses}>{t('لون خلفية الصندوق', 'QR Background')}</label>
                            <div className="flex items-center gap-3">
                               <div className="relative w-10 h-10 rounded-xl overflow-hidden border shadow-sm">
                                 <input type="color" value={formData.qrBgColor || 'transparent'} onChange={e => handleChange('qrBgColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                                 <div className="w-full h-full" style={{ backgroundColor: formData.qrBgColor || 'transparent' }} />
                               </div>
                               <span className="text-[11px] font-mono font-black uppercase dark:text-gray-400">{formData.qrBgColor || 'transparent'}</span>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                               <label className={labelClasses}>{t('حجم الباركود', 'QR Size')}</label>
                               <span className="text-[10px] font-black text-blue-600">{formData.qrSize || 90}px</span>
                            </div>
                            <input type="range" min="30" max="200" value={formData.qrSize || 90} onChange={e => handleChange('qrSize', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-blue-600 cursor-pointer" />
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                               <label className={labelClasses}>{t('سُمك الإطار', 'Border Width')}</label>
                               <span className="text-[10px] font-black text-blue-600">{formData.qrBorderWidth || 0}px</span>
                            </div>
                            <input type="range" min="0" max="20" value={formData.qrBorderWidth || 0} onChange={e => handleChange('qrBorderWidth', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-blue-600 cursor-pointer" />
                         </div>
                      </div>
                      <div className="pt-4 flex flex-col sm:flex-row gap-8 items-start sm:items-center border-t border-gray-100 dark:border-gray-700">
                         <div className="flex-1 w-full space-y-4">
                            <div className="flex justify-between items-center px-1">
                               <label className={labelClasses}>{t('انحناء الحواف', 'Border Radius')} : {formData.qrBorderRadius || 0}px</label>
                            </div>
                            <input type="range" min="0" max="80" value={formData.qrBorderRadius || 0} onChange={e => handleChange('qrBorderRadius', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-blue-600 cursor-pointer" />
                         </div>
                         <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-sm">
                            <label className={labelClasses + " !mb-0"}>{t('لون الإطار الخارجي', 'Outer Border Color')}</label>
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border shadow-sm">
                               <input type="color" value={formData.qrBorderColor || '#ffffff'} onChange={e => handleChange('qrBorderColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                               <div className="w-full h-full" style={{ backgroundColor: formData.qrBorderColor || '#ffffff' }} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-6 p-8 bg-blue-50/30 dark:bg-blue-900/5 rounded-[3rem] border border-blue-100/50 dark:border-blue-900/10">
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-black dark:text-white uppercase leading-none mb-1">{t('الوضع ليلي', 'Dark Mode')}</span>
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('تفعيل المظهر الداكن للبطاقة', 'Toggle dark aesthetics')}</span>
                        </div>
                        <button onClick={() => handleChange('isDark', !formData.isDark)} className={`w-14 h-7 rounded-full relative transition-all ${formData.isDark ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-gray-300 dark:bg-gray-700'}`}>
                           <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isRtl ? (formData.isDark ? 'right-8' : 'right-1') : (formData.isDark ? 'left-8' : 'left-1')}`} />
                        </button>
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-4 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 pt-4 sm:pt-0 sm:pl-8">
                        <div className="flex flex-col">
                           <span className="text-xs font-black dark:text-white uppercase leading-none mb-1">{t('رمز الـ QR', 'QR Code')}</span>
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('إظهار رمز المشاركة السريعة', 'Show quick share code')}</span>
                        </div>
                        <button onClick={() => handleChange('showQrCode', !formData.showQrCode)} className={`w-14 h-7 rounded-full relative transition-all ${formData.showQrCode !== false ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-gray-300 dark:bg-gray-700'}`}>
                           <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isRtl ? (formData.showQrCode !== false ? 'right-8' : 'right-1') : (formData.showQrCode !== false ? 'left-8' : 'left-1')}`} />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'occasion' && (
              <div className="space-y-8 animate-fade-in relative z-10">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-8 relative overflow-hidden">
                   <div className="flex items-center gap-3 relative z-10">
                      <PartyPopper className="text-blue-600" size={24} />
                      <h4 className="text-[12px] font-black uppercase tracking-widest dark:text-white">{t('قسم المناسبة خاصة', 'Special Occasion Section')}</h4>
                   </div>

                   <div className="grid grid-cols-1 gap-6 pt-4 border-t dark:border-gray-800">
                      <div className="space-y-2">
                         <label className={labelClasses}>{t('عنوان المناسبة', 'Occasion Title')}</label>
                         <input type="text" value={formData.occasionTitle || ''} onChange={e => handleChange('occasionTitle', e.target.value)} className={inputClasses} placeholder="Graduation Party" />
                      </div>
                      <div className="space-y-2">
                         <label className={labelClasses}>{t('نبذة عن المناسبة', 'Occasion Description')}</label>
                         <textarea value={formData.occasionDesc || ''} onChange={e => handleChange('occasionDesc', e.target.value)} className={`${inputClasses} min-h-[100px] resize-none`} placeholder="..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className={labelClasses}>{t('تاريخ المناسبة', 'Occasion Date')}</label>
                           <input type="datetime-local" value={formData.occasionDate || ''} onChange={e => handleChange('occasionDate', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className={labelClasses}>{t('رابط الموقع (الخريطة)', 'Map URL')}</label>
                           <input type="url" value={formData.occasionMapUrl || ''} onChange={e => handleChange('occasionMapUrl', e.target.value)} className={inputClasses} placeholder="https://maps.google.com/..." />
                        </div>
                      </div>
                   </div>

                   <div className="pt-8 border-t dark:border-gray-800 flex items-center justify-between px-1">
                      <div className="flex flex-col">
                         <span className="text-xs font-black dark:text-white uppercase leading-none mb-1">{t('تفعيل المناسبة', 'Occasion Display')}</span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('إظهار قسم المناسبة في البطاقة', 'Show occasion section')}</span>
                      </div>
                      <VisibilityToggle field="showOccasion" label="Occasion" />
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10">
            <button 
              onClick={() => onSave(formData, originalIdRef.current || undefined)}
              className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Save size={20} /> {t('حفظ التعديلات', 'Save Changes')}
            </button>
            <button 
              onClick={onCancel}
              className="px-10 py-5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-[2rem] font-black text-sm uppercase hover:bg-red-50 hover:text-red-500 transition-all"
            >
              {t('إلغاء', 'Cancel')}
            </button>
          </div>
        </div>

        <div className="hidden lg:block w-[400px] sticky top-[100px]">
          <div className="bg-white dark:bg-[#050507] p-6 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
             <div className="mb-6 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('معاينة حية', 'Live Preview')}</span>
                </div>
             </div>
             <div className="transition-all duration-500 border-[10px] border-gray-900 dark:border-gray-800 rounded-[3.5rem] shadow-2xl overflow-hidden mx-auto bg-white dark:bg-black w-full">
                <div className="h-[650px] overflow-y-auto no-scrollbar scroll-smooth">
                   <CardPreview 
                     data={formData} 
                     lang={lang} 
                     customConfig={currentTemplate?.config}
                     hideSaveButton={true} 
                   />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
