
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
  Pipette, Type as TypographyIcon, Smartphone, Tablet, Monitor, Eye, ArrowLeft, QrCode, RefreshCcw, FileText, Calendar, MapPin, PartyPopper, Move, Wind
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

const Editor: React.FC<EditorProps> = ({ lang, onSave, onCancel, initialData, isAdminEdit, templates, forcedTemplateId }) => {
  const isRtl = lang === 'ar';
  const t = (key: string, fallback?: string) => {
    if (fallback && !TRANSLATIONS[key]) return isRtl ? key : fallback;
    return TRANSLATIONS[key] ? (TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en']) : key;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const originalIdRef = useRef<string | null>(initialData?.id || null);

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [formData, setFormData] = useState<CardData>(() => {
    const targetTemplateId = initialData?.templateId || forcedTemplateId || templates[0]?.id || 'classic';
    const selectedTmpl = templates.find(t => t.id === targetTemplateId);
    const baseData = initialData || { ...(SAMPLE_DATA[lang] || SAMPLE_DATA['en']), id: generateSerialId(), templateId: targetTemplateId, showQrCode: true, showBio: true } as CardData;

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
         bioTextColor: selectedTmpl.config.bioTextColor || baseData.bioTextColor,
         bioBgColor: selectedTmpl.config.bioBgColor || baseData.bioBgColor,
         linksColor: selectedTmpl.config.linksColor || baseData.linksColor,
         qrColor: selectedTmpl.config.qrColor || baseData.qrColor,
         showBio: selectedTmpl.config.showBioByDefault ?? baseData.showBio,
         showQrCode: selectedTmpl.config.showQrCodeByDefault ?? baseData.showQrCode,
         // Occasion defaults
         showOccasion: baseData.showOccasion ?? (selectedTmpl.config.showOccasionByDefault ?? false),
         occasionTitleAr: baseData.occasionTitleAr || (selectedTmpl.config.occasionTitleAr || 'مناسبة خاصة'),
         occasionTitleEn: baseData.occasionTitleEn || (selectedTmpl.config.occasionTitleEn || 'Special Occasion'),
         occasionDate: baseData.occasionDate || (selectedTmpl.config.occasionDate || ''),
         occasionMapUrl: baseData.occasionMapUrl || (selectedTmpl.config.occasionMapUrl || ''),
         occasionOffsetY: baseData.occasionOffsetY ?? (selectedTmpl.config.occasionOffsetY || 0),
         occasionFloating: baseData.occasionFloating ?? (selectedTmpl.config.occasionFloating ?? true),
         occasionPrimaryColor: baseData.occasionPrimaryColor || (selectedTmpl.config.occasionPrimaryColor || '#7c3aed'),
         occasionBgColor: baseData.occasionBgColor || (selectedTmpl.config.occasionBgColor || ''),
         occasionTitleColor: baseData.occasionTitleColor || (selectedTmpl.config.occasionTitleColor || '')
       } as CardData;
    }
    return baseData;
  });

  const [activeImgTab, setActiveImgTab] = useState<'upload' | 'link'>('upload');
  const [activeBgImgTab, setActiveBgImgTab] = useState<'presets' | 'upload' | 'link'>('presets');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [socialInput, setSocialInput] = useState({ platformId: SOCIAL_PLATFORMS[0].id, url: '' });
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const currentTemplate = templates.find(t => t.id === formData.templateId);

  const handleChange = (field: keyof CardData, value: any) => {
    if (field === 'id') { value = (value || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); setSlugStatus('idle'); }
    if (field === 'templateId') {
      const newTmpl = templates.find(t => t.id === value);
      if (newTmpl) {
        setFormData(prev => ({
          ...prev,
          templateId: value,
          nameColor: newTmpl.config.nameColor || prev.nameColor,
          titleColor: newTmpl.config.titleColor || prev.titleColor,
          bioTextColor: newTmpl.config.bioTextColor || prev.bioTextColor,
          bioBgColor: newTmpl.config.bioBgColor || prev.bioBgColor,
          linksColor: newTmpl.config.linksColor || prev.linksColor,
          qrColor: newTmpl.config.qrColor || prev.qrColor,
          themeType: newTmpl.config.defaultThemeType || prev.themeType,
          themeColor: newTmpl.config.defaultThemeColor || prev.themeColor,
          themeGradient: newTmpl.config.defaultThemeGradient || prev.themeGradient,
          backgroundImage: newTmpl.config.defaultBackgroundImage || prev.backgroundImage,
          isDark: newTmpl.config.defaultIsDark ?? prev.isDark,
          showBio: newTmpl.config.showBioByDefault ?? prev.showBio,
          showQrCode: newTmpl.config.showQrCodeByDefault ?? prev.showQrCode,
          showOccasion: newTmpl.config.showOccasionByDefault ?? prev.showOccasion,
          occasionOffsetY: newTmpl.config.occasionOffsetY ?? prev.occasionOffsetY,
          occasionFloating: newTmpl.config.occasionFloating ?? prev.occasionFloating,
          occasionPrimaryColor: newTmpl.config.occasionPrimaryColor || prev.occasionPrimaryColor,
          occasionBgColor: newTmpl.config.occasionBgColor || prev.occasionBgColor,
          occasionTitleColor: newTmpl.config.occasionTitleColor || prev.occasionTitleColor
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetToTemplateColors = () => {
    if (!currentTemplate) return;
    handleChange('templateId', currentTemplate.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try { const b = await uploadImageToCloud(file); if (b) handleChange('profileImage', b); } finally { setIsUploading(false); }
  };

  const checkAvailability = async () => {
    if (!formData.id || formData.id.length < 3) return;
    setSlugStatus('checking');
    const available = await isSlugAvailable(formData.id, formData.ownerId || auth.currentUser?.uid);
    setSlugStatus(available ? 'available' : 'taken');
  };

  const addSocialLink = () => {
    if (!socialInput.url) return;
    const platform = SOCIAL_PLATFORMS.find(p => p.id === socialInput.platformId);
    if (!platform) return;
    setFormData(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { platform: platform.name, url: socialInput.url, platformId: platform.id }] }));
    setSocialInput({ ...socialInput, url: '' });
  };

  const ColorPickerField = ({ label, field, value, compact = false }: { label: string, field: keyof CardData, value?: string | null, compact?: boolean }) => (
    <div className={`flex items-center justify-between gap-3 bg-white dark:bg-gray-800 ${compact ? 'p-2' : 'p-3'} rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-violet-200`}>
      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex items-center gap-2">
         <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"><input type="color" value={value || (formData.isDark ? '#333333' : '#ffffff')} onChange={(e) => handleChange(field, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" /><div className="w-full h-full" style={{ backgroundColor: value || (formData.isDark ? '#333333' : '#ffffff') }} /></div>
         <button onClick={() => handleChange(field, null)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><X size={12}/></button>
      </div>
    </div>
  );

  const PreviewContent = ({ isMobileView = false }) => (
    <div className="flex flex-col items-center w-full">
      {!isMobileView && (
        <div className="mb-6 w-full flex items-center justify-between px-6">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isRtl ? 'معاينة حية' : 'Live Preview'}</span></div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
             <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Smartphone size={16}/></button>
             <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded-lg transition-all ${previewDevice === 'tablet' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Tablet size={16}/></button>
             <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}><Monitor size={16}/></button>
          </div>
        </div>
      )}
      <div className={`transition-all duration-500 ease-in-out origin-top border-[8px] border-gray-900 dark:border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden bg-white dark:bg-gray-950 ${isMobileView ? 'w-[280px]' : previewDevice === 'mobile' ? 'w-[320px]' : previewDevice === 'tablet' ? 'w-[480px]' : 'w-[360px]'}`}>
        <div className={`no-scrollbar overflow-x-hidden ${isMobileView ? 'h-[500px]' : 'h-[640px]'} overflow-y-auto`}>
          <CardPreview data={formData} lang={lang} customConfig={currentTemplate?.config} hideSaveButton={true} />
        </div>
      </div>
    </div>
  );

  const labelClasses = "block text-[9px] font-black text-gray-400 dark:text-gray-500 mb-1 px-1 uppercase tracking-widest";
  const inputClasses = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1f] text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all shadow-sm placeholder:text-gray-300 font-medium text-[13px]";

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-8 pb-32 items-start justify-center">
        <div className="w-full lg:max-w-[960px] flex-1 space-y-6">
          <div className="bg-white dark:bg-[#121215] p-5 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full"><input type="text" value={formData.id} onChange={e => handleChange('id', e.target.value)} className={`${inputClasses} ${isRtl ? 'pr-10' : 'pl-10'} !py-3 !rounded-xl text-blue-600 font-black text-base`} placeholder="username" /><Hash className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-400`} size={18} /><div className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>{slugStatus === 'available' && <CheckCircle2 className="text-emerald-500" size={20} />}{slugStatus === 'taken' && <AlertCircle className="text-red-500" size={20} />}</div></div>
              <button onClick={checkAvailability} disabled={slugStatus === 'checking'} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md flex items-center justify-center gap-2">{slugStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}{isRtl ? 'تحقق من الرابط' : 'Check URL'}</button>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-900/20 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-3 flex flex-col items-center gap-4">
                  <div className="relative group"><div className="w-28 h-28 rounded-[2.2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center">{formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={36} className="text-gray-300" />}{isUploading && <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-white" size={24} /></div>}</div><button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Camera size={16} /></button></div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
              <div className="xl:col-span-9 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>{t('fullName')}</label><input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inputClasses} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClasses}>{t('jobTitle')}</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} className={inputClasses} /></div>
                        <div><label className={labelClasses}>{t('company')}</label><input type="text" value={formData.company} onChange={e => handleChange('company', e.target.value)} className={inputClasses} /></div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Occasion Section For User - Improved Labels & Controls */}
            <div className="bg-violet-50 dark:bg-violet-900/10 p-6 md:p-8 rounded-[3rem] border border-violet-100 dark:border-violet-900/30 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-500/20"><PartyPopper size={22} /></div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-violet-700 dark:text-violet-300 tracking-widest leading-none mb-1">{isRtl ? 'تفعيل قسم المناسبة الخاصة' : 'Enable Special Occasion'}</h4>
                        <p className="text-[9px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-widest">{isRtl ? 'زفاف، تخرج، افتتاح، إلخ' : 'Wedding, Graduation, Launch, etc'}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleChange('showOccasion', !formData.showOccasion)} 
                     className={`w-14 h-7 rounded-full relative transition-all ${formData.showOccasion ? 'bg-violet-600 shadow-inner' : 'bg-gray-200 dark:bg-gray-700'}`}
                   >
                     <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isRtl ? (formData.showOccasion ? 'right-8' : 'right-1') : (formData.showOccasion ? 'left-8' : 'left-1')}`} />
                   </button>
                </div>

                {formData.showOccasion && (
                   <div className="space-y-8 animate-fade-in pt-6 border-t border-violet-100/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div>
                              <label className={labelClasses}>{isRtl ? 'عنوان المناسبة (عربي)' : 'Occasion Title (Arabic)'}</label>
                              <input 
                                type="text" 
                                value={formData.occasionTitleAr} 
                                onChange={e => handleChange('occasionTitleAr', e.target.value)} 
                                className={`${inputClasses} !bg-white/80 dark:!bg-black/20`}
                                placeholder="مناسبة خاصة" 
                              />
                           </div>
                           <div>
                              <label className={labelClasses}>{isRtl ? 'Occasion Title (English)' : 'Occasion Title (English)'}</label>
                              <input 
                                type="text" 
                                value={formData.occasionTitleEn} 
                                onChange={e => handleChange('occasionTitleEn', e.target.value)} 
                                className={`${inputClasses} !bg-white/80 dark:!bg-black/20`}
                                placeholder="Special Occasion" 
                              />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className={labelClasses}>{isRtl ? 'تاريخ ووقت المناسبة' : 'Event Date & Time'}</label>
                              <input 
                                type="datetime-local" 
                                value={formData.occasionDate} 
                                onChange={e => handleChange('occasionDate', e.target.value)} 
                                className={`${inputClasses} block !bg-white/80 dark:!bg-black/20 !py-3 !px-4 min-h-[52px] [direction:ltr] text-right font-bold`} 
                              />
                           </div>
                           <div>
                              <label className={labelClasses}>{isRtl ? 'رابط خرائط قوقل' : 'Google Maps Link'}</label>
                              <div className="relative">
                                 <MapPin className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-violet-400`} size={16} />
                                 <input 
                                   type="url" 
                                   value={formData.occasionMapUrl} 
                                   onChange={e => handleChange('occasionMapUrl', e.target.value)} 
                                   className={`${inputClasses} ${isRtl ? 'pr-10' : 'pl-10'} !bg-white/80 dark:!bg-black/20`} 
                                   placeholder="https://maps.google.com/..." 
                                 />
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* إعدادات التموضع والألوان للمناسبة */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/40 dark:bg-black/20 rounded-[2rem] border border-violet-100/50">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                               <label className={labelClasses}>{isRtl ? 'إزاحة القسم (فوق / تحت)' : 'Section Offset (Y Axis)'}</label>
                               <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">{formData.occasionOffsetY || 0}px</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <Move size={18} className="text-violet-400 shrink-0" />
                               <input 
                                 type="range" 
                                 min="-250" 
                                 max="150" 
                                 value={formData.occasionOffsetY || 0} 
                                 onChange={e => handleChange('occasionOffsetY', parseInt(e.target.value))} 
                                 className="flex-1 h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full appearance-none accent-violet-600 cursor-pointer"
                               />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                               <div className="flex items-center gap-3">
                                  <Wind size={18} className="text-violet-500" />
                                  <span className={labelClasses + " !mb-0"}>{isRtl ? 'تفعيل تحريك الطفو' : 'Enable Float Animation'}</span>
                               </div>
                               <button 
                                 onClick={() => handleChange('occasionFloating', !formData.occasionFloating)} 
                                 className={`w-12 h-6 rounded-full relative transition-all ${formData.occasionFloating !== false ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                               >
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isRtl ? (formData.occasionFloating !== false ? 'right-7' : 'right-1') : (formData.occasionFloating !== false ? 'left-7' : 'left-1')}`} />
                               </button>
                            </div>
                         </div>
                         
                         <div className="space-y-3">
                            <label className={labelClasses}>{isRtl ? 'تخصيص ألوان المناسبة' : 'Customize Occasion Colors'}</label>
                            <div className="grid grid-cols-1 gap-2">
                               <ColorPickerField label={isRtl ? "اللون الأساسي" : "Primary"} field="occasionPrimaryColor" value={formData.occasionPrimaryColor} compact />
                               <ColorPickerField label={isRtl ? "خلفية البطاقة" : "Background"} field="occasionBgColor" value={formData.occasionBgColor} compact />
                               <ColorPickerField label={isRtl ? "لون العنوان" : "Title Color"} field="occasionTitleColor" value={formData.occasionTitleColor} compact />
                            </div>
                         </div>
                      </div>
                   </div>
                )}
            </div>

            <div className="bg-white dark:bg-[#121215] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4"><Layout className="text-blue-600" size={20} /><h4 className="text-[12px] font-black uppercase text-gray-700 dark:text-gray-300 tracking-widest">{isRtl ? 'اختر قالب التصميم' : 'Select Layout Template'}</h4></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {templates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => handleChange('templateId', tmpl.id)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${formData.templateId === tmpl.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}><Layout size={18} className={formData.templateId === tmpl.id ? 'text-white' : 'group-hover:text-blue-500'} /><span className="text-[9px] font-black uppercase text-center truncate w-full">{isRtl ? tmpl.nameAr : tmpl.nameEn}</span></button>
                    ))}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50 dark:border-gray-800 space-y-8">
                 <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Palette className="text-blue-600" size={20} /><h4 className="text-[12px] font-black uppercase text-gray-700 dark:text-gray-300 tracking-widest">{isRtl ? 'المظهر والألوان' : 'Appearance & Colors'}</h4></div><button onClick={resetToTemplateColors} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors"><RefreshCcw size={12} /> {isRtl ? 'استعادة ألوان القالب' : 'Reset Colors'}</button></div>
                 <div className="flex flex-col items-center gap-6">
                    <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shrink-0 w-full sm:w-auto"><button onClick={() => handleChange('themeType', 'color')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.themeType === 'color' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}> <Palette size={16} /> </button><button onClick={() => handleChange('themeType', 'gradient')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.themeType === 'gradient' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}> <Sparkles size={16} /> </button><button onClick={() => handleChange('themeType', 'image')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.themeType === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}> <ImageIcon size={16} /> </button></div>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ColorPickerField label={t('الاسم', 'Name')} field="nameColor" value={formData.nameColor} />
                        <ColorPickerField label={t('المسمى', 'Title')} field="titleColor" value={formData.titleColor} />
                        <ColorPickerField label={t('الباركود', 'QR')} field="qrColor" value={formData.qrColor} />
                    </div>
                 </div>
              </div>
            </div>

            <button onClick={() => onSave(formData, originalIdRef.current || undefined)} className="hidden lg:flex w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl items-center justify-center gap-4 hover:scale-[1.01] transition-all"><Save size={24} /> {t('saveChanges')}</button>
          </div>
        </div>
        <div className="hidden lg:block w-[480px] sticky top-12 self-start"><div className="p-4 bg-white dark:bg-gray-900 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"><PreviewContent /></div></div>
      </div>
    </div>
  );
};

export default Editor;
