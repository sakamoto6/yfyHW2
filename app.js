const { createApp, ref, computed, nextTick, watch, onMounted, onBeforeUnmount } = Vue;

const supabaseConfig = {
  url: 'https://qtaueamilkqvcyfotetx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YXVlYW1pbGtxdmN5Zm90ZXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTAzODAsImV4cCI6MjEwNzI4NjM4MH0.WzGj8B-cjcqkcuerqLjiPkOCwSxaF3R6ecYsGFskmpY',
};

const hasSupabaseConfig = !!supabaseConfig.url &&
  supabaseConfig.url.includes('supabase.co') &&
  !!supabaseConfig.anonKey &&
  !supabaseConfig.anonKey.includes('YOUR_');

const supabaseClient = hasSupabaseConfig && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

const scentNoteTranslations = {
  'pink pepper': '粉紅胡椒',
  neroli: '橙花',
  lemon: '檸檬',
  rum: '朗姆酒',
  'clary sage': '快樂鼠尾草',
  'java vetiver': '爪哇岩蘭草',
  vetiver: '岩蘭草',
  'tobacco leaf': '煙草葉',
  tobacco: '煙草',
  'vanilla bean': '香草豆',
  vanilla: '香草',
  styrax: '蘇合香',
  bergamot: '佛手柑',
  lavender: '薰衣草',
  rose: '玫瑰',
  jasmine: '茉莉',
  sandalwood: '檀香',
  cedar: '雪松',
  patchouli: '廣藿香',
  musk: '麝香',
  amber: '琥珀',
  iris: '鳶尾花',
  cardamom: '小荳蔻',
  coconut: '椰子',
  fig: '無花果',
  'green leaves': '綠葉',
  ginger: '生薑',
  nutmeg: '肉豆蔻',
  cinnamon: '肉桂',
  clove: '丁香',
  incense: '焚香',
  benzoin: '安息香',
  labdanum: '岩薔薇脂',
  oud: '烏木',
  oakmoss: '橡木苔',
  grapefruit: '葡萄柚',
  mint: '薄荷',
  basil: '羅勒',
  rosemary: '迷迭香',
  violet: '紫羅蘭',
  tuberose: '晚香玉',
  'ylang-ylang': '依蘭',
  freesia: '小蒼蘭',
  peony: '牡丹',
  saffron: '藏紅花',
  leather: '皮革',
  suede: '麂皮',
  'ambergris': '龍涎香',
  ambroxan: '龍涎香醚',
  'orange blossom': '橙花',
  'lily of the valley': '鈴蘭',
};

const translateScentNote = (note) => {
  if (typeof note !== 'string') return note;
  const normalized = note.trim().toLowerCase();
  return scentNoteTranslations[normalized] || note;
};

const translateScentNotes = (notes) => ({
  top: Array.isArray(notes?.top) ? notes.top.map(translateScentNote) : [],
  mid: Array.isArray(notes?.mid) ? notes.mid.map(translateScentNote) : [],
  base: Array.isArray(notes?.base) ? notes.base.map(translateScentNote) : [],
});

const createPerfumeImageUrl = async (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const { data, error } = await supabaseClient.storage
    .from('perfume-images')
    .createSignedUrl(imagePath, 60 * 60 * 24);
  if (error) {
    console.error('Create perfume image URL failed:', error);
    return '';
  }
  return data.signedUrl;
};

const demoPerfumes = [
  {
    id: 1,
    brand: 'Diptyque',
    name: 'Philosykos (希臘由金)',
    concentration: 'EDP',
    sizeMl: 75,
    remainingMl: 55,
    rating: 5,
    seasons: ['Spring', 'Summer'],
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=60',
    notes: {
      top: ['無花果葉', '無花果'],
      mid: ['椰子', '綠葉'],
      base: ['雪松', '木質調']
    }
  },
  {
    id: 2,
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    concentration: 'EDT',
    sizeMl: 100,
    remainingMl: 80,
    rating: 5,
    seasons: ['Spring', 'Summer', 'Autumn'],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=60',
    notes: {
      top: ['檸檬', '薄荷', '粉紅胡椒'],
      mid: ['生薑', '肉豆蔻', '茉莉'],
      base: ['檀香', '雪松', '廣藿香']
    }
  },
  {
    id: 3,
    brand: 'Le Labo',
    name: 'Santal 33',
    concentration: 'EDP',
    sizeMl: 100,
    remainingMl: 30,
    rating: 4,
    seasons: ['Autumn', 'Winter'],
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=300&auto=format&fit=crop&q=60',
    notes: {
      top: ['紫羅蘭', '豆蔻'],
      mid: ['鳶尾花', '龍涎香'],
      base: ['檀香', '雪松', '皮革']
    }
  }
];

const demoLogs = [
  { id: 1, date: '2026-10-11', perfumeName: 'Diptyque - Philosykos', sprays: 3, occasion: '休閒聚會' },
  { id: 2, date: '2026-10-10', perfumeName: 'Chanel - Bleu de Chanel', sprays: 4, occasion: '辦公室上班' }
];

const app = createApp({
  setup() {
    const currentTab = ref('vault');
    const scanMode = ref('box');
    const searchQuery = ref('');
    const filterSeason = ref('All');
    const isScanning = ref(false);
    const isSavingPerfume = ref(false);
    const scanResult = ref(null);
    const scanError = ref('');
    const selectedImage = ref(null);
    const selectedImagePreview = ref('');
    const selectedImageName = ref('');
    const isSupabaseReady = ref(Boolean(supabaseClient));
    const requiresAuth = ref(Boolean(supabaseClient));
    const authUser = ref(null);
    const authMode = ref('login');
    const authEmail = ref('');
    const authPassword = ref('');
    const authError = ref('');
    const authMessage = ref('');
    const isAuthLoading = ref(false);
    const dataError = ref('');
    const chartInstances = { wheel: null, season: null };
    const perfumes = ref([]);
    const perfumeHistory = ref([]);
    const historyAvailable = ref(false);
    const historyError = ref('');
    const isArchivingPerfume = ref(false);
    const logs = ref([]);
    const editingPerfume = ref(null);
    const perfumeDraft = ref(null);
    const editError = ref('');
    const isUpdatingPerfume = ref(false);
    const newLog = ref({ perfumeId: 1, sprays: 3, occasion: '辦公室上班' });

    const loadInitialData = async () => {
      if (!supabaseClient) {
        perfumes.value = demoPerfumes;
        perfumeHistory.value = [];
        historyAvailable.value = true;
        logs.value = demoLogs;
        return;
      }

      try {
        const { data: perfumeData, error: perfumeError } = await supabaseClient
          .from('perfumes')
          .select('*')
          .order('id', { ascending: true });

        if (perfumeError) throw perfumeError;
        perfumes.value = await Promise.all((perfumeData || []).map(async item => {
          const imagePath = item.image && !/^https?:\/\//i.test(item.image) ? item.image : '';
          return {
            ...item,
            sizeMl: item.size_ml ?? item.sizeMl,
            remainingMl: item.remaining_ml ?? item.remainingMl,
            purchase_date: item.purchase_date || null,
            seasons: item.seasons || [],
            notes: translateScentNotes(item.notes),
            imagePath,
            image: imagePath ? await createPerfumeImageUrl(imagePath) : item.image,
          };
        }));

        const { data: logData, error: logError } = await supabaseClient
          .from('logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (logError) throw logError;
        logs.value = (logData || []).map(item => ({
          id: item.id,
          date: item.date || new Date(item.created_at).toLocaleDateString('sv-SE'),
          perfumeName: item.perfume_name,
          sprays: item.sprays,
          occasion: item.occasion,
        }));

        const { data: historyData, error: historyLoadError } = await supabaseClient
          .from('perfume_history')
          .select('*')
          .order('finished_date', { ascending: false });
        if (historyLoadError) {
          console.warn('Perfume history is not available:', historyLoadError.message);
          historyAvailable.value = false;
          historyError.value = '歷史紀錄資料表尚未建立，請先執行最新版 supabase-schema.sql。';
          perfumeHistory.value = [];
        } else {
          historyAvailable.value = true;
          historyError.value = '';
          perfumeHistory.value = await Promise.all((historyData || []).map(async item => {
            const imagePath = item.image && !/^https?:\/\//i.test(item.image) ? item.image : '';
            return {
              ...item,
              imagePath,
              image: imagePath ? await createPerfumeImageUrl(imagePath) : item.image,
              notes: translateScentNotes(item.notes),
            };
          }));
        }
        dataError.value = '';
      } catch (error) {
        console.error('Supabase loading failed:', error);
        dataError.value = `資料載入失敗：${error.message}`;
        perfumes.value = [];
        logs.value = [];
      }
    };

    const submitAuth = async () => {
      if (!supabaseClient) return;
      isAuthLoading.value = true;
      authError.value = '';
      authMessage.value = '';

      try {
        const result = authMode.value === 'signup'
          ? await supabaseClient.auth.signUp({ email: authEmail.value, password: authPassword.value })
          : await supabaseClient.auth.signInWithPassword({ email: authEmail.value, password: authPassword.value });

        if (result.error) throw result.error;
        if (authMode.value === 'signup' && !result.data.session) {
          authMessage.value = '註冊完成，請到電子郵件收取確認連結，再回來登入。';
          authPassword.value = '';
        }
      } catch (error) {
        authError.value = error.message || '登入失敗，請檢查電子郵件與密碼。';
      } finally {
        isAuthLoading.value = false;
      }
    };

    const toggleAuthMode = () => {
      authMode.value = authMode.value === 'login' ? 'signup' : 'login';
      authError.value = '';
      authMessage.value = '';
    };

    const signOut = async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) authError.value = error.message;
    };

    let authSubscription;
    onMounted(() => {
      if (!supabaseClient) {
        loadInitialData();
        return;
      }

      const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        authUser.value = session?.user || null;
        authError.value = '';
        if (session?.user) {
          Promise.resolve().then(loadInitialData);
        } else {
          perfumes.value = [];
          logs.value = [];
        }
      });
      authSubscription = data.subscription;
    });

    onBeforeUnmount(() => authSubscription?.unsubscribe());

    const filteredPerfumes = computed(() => {
      return perfumes.value.filter(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchQuery.value.toLowerCase());

        const matchesSeason =
          filterSeason.value === 'All' || item.seasons.includes(filterSeason.value);

        return matchesSearch && matchesSeason;
      });
    });

    const tabClass = (tab) => {
      return currentTab.value === tab
        ? 'bg-amber-500/20 text-amber-300 font-bold px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm border border-amber-500/30'
        : 'text-slate-400 hover:text-slate-200 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition';
    };

    const scanTabClass = (mode) => {
      return scanMode.value === mode
        ? 'flex-1 py-2.5 bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs sm:text-sm border border-amber-500/30'
        : 'flex-1 py-2.5 text-slate-400 hover:text-slate-200 text-xs sm:text-sm transition';
    };

    const filterBtnClass = (season) => {
      return filterSeason.value === season
        ? 'bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs shadow-md'
        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg text-xs';
    };

    const handleImageSelection = (event) => {
      const file = event.target.files?.[0];
      scanError.value = '';
      scanResult.value = null;

      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        scanError.value = '請選擇 JPG、PNG 或 WebP 圖片。';
        event.target.value = '';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        scanError.value = '圖片超過 4 MB，請縮小圖片後再試。';
        event.target.value = '';
        return;
      }

      if (selectedImagePreview.value) URL.revokeObjectURL(selectedImagePreview.value);
      selectedImage.value = file;
      selectedImagePreview.value = URL.createObjectURL(file);
      selectedImageName.value = file.name;
    };

    const replacePerfumeImage = async (item, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
        alert('請選擇 4 MB 以下的 JPG、PNG 或 WebP 圖片。');
        event.target.value = '';
        return;
      }

      let newImagePath = '';
      try {
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
        newImagePath = `${authUser.value.id}/${item.id}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('perfume-images')
          .upload(newImagePath, file, { contentType: file.type, cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { error: updateError } = await supabaseClient
          .from('perfumes')
          .update({ image: newImagePath })
          .eq('id', item.id)
          .eq('user_id', authUser.value.id);
        if (updateError) throw updateError;

        const previousImagePath = item.imagePath;
        item.imagePath = newImagePath;
        item.image = await createPerfumeImageUrl(newImagePath);
        if (previousImagePath) {
          await supabaseClient.storage.from('perfume-images').remove([previousImagePath]);
        }
      } catch (error) {
        if (newImagePath) await supabaseClient.storage.from('perfume-images').remove([newImagePath]);
        console.error('Replace perfume image failed:', error);
        alert(`照片更新失敗：${error.message || '請確認 Supabase Storage 設定後重試。'}`);
      } finally {
        event.target.value = '';
      }
    };

    const analyzeImage = async () => {
      scanError.value = '';
      scanResult.value = null;
      if (!supabaseClient || !authUser.value) {
        scanError.value = '請先登入 Supabase 帳號再使用照片辨識。';
        return;
      }
      if (!selectedImage.value) {
        scanError.value = '請先拍照或選擇一張香水照片。';
        return;
      }

      isScanning.value = true;
      try {
        const bytes = new Uint8Array(await selectedImage.value.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        const imageBase64 = btoa(binary);
        const { data, error } = await supabaseClient.functions.invoke('analyze-perfume', {
          body: {
            imageBase64,
            mimeType: selectedImage.value.type,
            mode: scanMode.value,
            collection: perfumes.value.slice(0, 20).map(item => ({
              brand: item.brand,
              name: item.name,
              concentration: item.concentration,
              notes: item.notes,
            })),
          },
        });
        if (error) {
          let detail = error.message;
          try {
            const response = error.context;
            if (response && typeof response.json === 'function') {
              const body = await response.json();
              detail = body.error || body.message || detail;
            }
          } catch {
            // Keep the original function error if its response is not JSON.
          }
          throw new Error(detail);
        }
        if (scanMode.value === 'box' && !data?.boxData) {
          throw new Error('辨識服務回傳格式不完整，請重試或使用示範資料。');
        }
        if (scanMode.value === 'match' && !data?.matchData) {
          throw new Error('比對服務回傳格式不完整，請重試或使用示範資料。');
        }
        if (data.boxData) data.boxData.notes = translateScentNotes(data.boxData.notes);
        if (data.boxData) data.boxData.purchaseDate = new Date().toLocaleDateString('sv-SE');
        scanResult.value = { ...data, source: 'gemini' };
      } catch (error) {
        console.error('Perfume image analysis failed:', error);
        scanError.value = error.message || '照片辨識失敗，請稍後再試。';
      } finally {
        isScanning.value = false;
      }
    };

    const simulateScan = () => {
      isScanning.value = true;
      scanError.value = '';
      scanResult.value = null;

      setTimeout(() => {
        isScanning.value = false;

        if (scanMode.value === 'box') {
          scanResult.value = {
            boxData: {
              brand: 'Maison Margiela',
              name: 'REPLICA Jazz Club',
              concentration: 'EDT',
              sizeMl: 100,
              purchaseDate: new Date().toLocaleDateString('sv-SE'),
              remainingMl: 100,
              rating: 5,
              seasons: ['Autumn', 'Winter'],
              image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=60',
              notes: {
                top: ['粉紅胡椒', '橙花', '檸檬'],
                mid: ['朗姆酒', '鼠尾草', '岩蘭草'],
                base: ['煙草葉', '香草豆', '安息香']
              }
            },
            confidence: 100,
            source: 'demo'
          };
        } else {
          scanResult.value = {
            matchData: {
              brand: 'Maison Margiela',
              targetName: 'REPLICA Jazz Club',
              concentration: 'EDT',
              score: 88,
              dnaReason: '含有您偏好的溫暖粉紅胡椒與安息香木質底蘊，與您評分最高的 Le Labo 33 同屬暖香調。',
              redundancyAlert: '與已擁有的 Santal 33 同屬秋冬款，但此款多帶朗姆酒美食調，相似度 40%（不易重疊）。',
              gapAnalysis: '完美補足您收藏庫中欠缺的「深夜約會 / 爵士酒吧」夜間沉穩穿香情境！'
            },
            confidence: 100,
            source: 'demo'
          };
        }
      }, 1200);
    };

    const addBoxToVault = async () => {
      if (isSavingPerfume.value || !scanResult.value?.boxData) return;
      const sizeMl = Number(scanResult.value.boxData.sizeMl);
      if (!scanResult.value.boxData.brand?.trim() || !scanResult.value.boxData.name?.trim() || !Number.isFinite(sizeMl) || sizeMl < 1 || sizeMl > 5000) {
        alert('請確認品牌、香水名稱與有效容量後再儲存。');
        return;
      }

      isSavingPerfume.value = true;
      let uploadedImagePath = '';
      try {
        const payload = {
          id: Date.now(),
          brand: scanResult.value.boxData.brand.trim(),
          name: scanResult.value.boxData.name.trim(),
          concentration: scanResult.value.boxData.concentration,
          size_ml: sizeMl,
          remaining_ml: sizeMl,
          purchase_date: scanResult.value.boxData.purchaseDate || null,
          rating: scanResult.value.boxData.rating ?? 5,
          seasons: scanResult.value.boxData.seasons ?? [],
          image: scanResult.value.boxData.image || '',
          notes: translateScentNotes(scanResult.value.boxData.notes),
          user_id: authUser.value?.id,
        };

        if (supabaseClient) {
          if (selectedImage.value) {
            const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[selectedImage.value.type];
            uploadedImagePath = `${authUser.value.id}/${payload.id}-${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabaseClient.storage
              .from('perfume-images')
              .upload(uploadedImagePath, selectedImage.value, {
                contentType: selectedImage.value.type,
                cacheControl: '3600',
                upsert: false,
              });
            if (uploadError) throw new Error(`圖片上傳失敗：${uploadError.message}`);
            payload.image = uploadedImagePath;
          }

          const { error } = await supabaseClient.from('perfumes').insert([payload]);
          if (error) throw new Error(`香水儲存失敗：${error.message}`);
        }

        const imageUrl = uploadedImagePath
          ? await createPerfumeImageUrl(uploadedImagePath)
          : payload.image;
        perfumes.value.push({
          id: payload.id,
          brand: payload.brand,
          name: payload.name,
          concentration: payload.concentration,
          sizeMl: payload.size_ml,
          remainingMl: payload.remaining_ml,
          purchase_date: payload.purchase_date,
          rating: payload.rating,
          seasons: payload.seasons,
          image: imageUrl,
          imagePath: uploadedImagePath,
          notes: payload.notes,
        });

        alert('🎉 香水已新增至典藏庫！');
        currentTab.value = 'vault';
        scanResult.value = null;
      } catch (error) {
        console.error('Save perfume failed:', error);
        if (uploadedImagePath) {
          await supabaseClient.storage.from('perfume-images').remove([uploadedImagePath]);
        }
        alert(error.message || '香水儲存失敗，請稍後重試。');
      } finally {
        isSavingPerfume.value = false;
      }
    };

    const openPerfumeEditor = (item) => {
      editingPerfume.value = item;
      perfumeDraft.value = {
        brand: item.brand || '',
        name: item.name || '',
        concentration: item.concentration || '',
        sizeMl: Number(item.sizeMl ?? item.size_ml) || 0,
        remainingMl: Number(item.remainingMl ?? item.remaining_ml) || 0,
        rating: Number(item.rating) || 0,
        purchaseDate: item.purchase_date || '',
        seasons: [...(item.seasons || [])],
        topNotes: (item.notes?.top || []).join('、'),
        midNotes: (item.notes?.mid || []).join('、'),
        baseNotes: (item.notes?.base || []).join('、'),
      };
      editError.value = '';
    };

    const closePerfumeEditor = () => {
      if (isUpdatingPerfume.value) return;
      editingPerfume.value = null;
      perfumeDraft.value = null;
      editError.value = '';
    };

    const savePerfumeEdit = async () => {
      if (!editingPerfume.value || !perfumeDraft.value || isUpdatingPerfume.value) return;
      const sizeMl = Number(perfumeDraft.value.sizeMl);
      const remainingMl = Number(perfumeDraft.value.remainingMl);
      const rating = Number(perfumeDraft.value.rating);
      if (!perfumeDraft.value.brand.trim() || !perfumeDraft.value.name.trim() || !Number.isFinite(sizeMl) || sizeMl < 1 || sizeMl > 5000 || !Number.isFinite(remainingMl) || remainingMl < 0 || remainingMl > sizeMl || !Number.isFinite(rating) || rating < 0 || rating > 5) {
        editError.value = '請確認品牌、名稱、容量、剩餘容量與評分格式正確。';
        return;
      }

      isUpdatingPerfume.value = true;
      editError.value = '';
      const payload = {
        brand: perfumeDraft.value.brand.trim(),
        name: perfumeDraft.value.name.trim(),
        concentration: perfumeDraft.value.concentration.trim(),
        size_ml: sizeMl,
        remaining_ml: remainingMl,
        rating,
        purchase_date: perfumeDraft.value.purchaseDate || null,
        seasons: perfumeDraft.value.seasons,
        notes: translateScentNotes({
          top: perfumeDraft.value.topNotes.split(/[,，、]/).map(note => note.trim()).filter(Boolean),
          mid: perfumeDraft.value.midNotes.split(/[,，、]/).map(note => note.trim()).filter(Boolean),
          base: perfumeDraft.value.baseNotes.split(/[,，、]/).map(note => note.trim()).filter(Boolean),
        }),
      };

      try {
        if (supabaseClient) {
          const { error } = await supabaseClient
            .from('perfumes')
            .update(payload)
            .eq('id', editingPerfume.value.id)
            .eq('user_id', authUser.value.id);
          if (error) throw error;
        }
        Object.assign(editingPerfume.value, {
          ...payload,
          sizeMl,
          remainingMl,
          purchase_date: payload.purchase_date,
          seasons: [...payload.seasons],
          notes: payload.notes,
        });
        editingPerfume.value = null;
        perfumeDraft.value = null;
      } catch (error) {
        console.error('Update perfume failed:', error);
        editError.value = `儲存失敗：${error.message || '請稍後重試。'}`;
      } finally {
        isUpdatingPerfume.value = false;
      }
    };

    const deletePerfume = async (item) => {
      if (!window.confirm(`確定要刪除「${item.brand} - ${item.name}」嗎？此操作無法復原。`)) return;
      try {
        if (supabaseClient) {
          const { error } = await supabaseClient
            .from('perfumes')
            .delete()
            .eq('id', item.id)
            .eq('user_id', authUser.value.id);
          if (error) throw error;
          if (item.imagePath) {
            const { error: imageError } = await supabaseClient.storage
              .from('perfume-images')
              .remove([item.imagePath]);
            if (imageError) console.warn('Could not remove perfume image:', imageError.message);
          }
        }
        perfumes.value = perfumes.value.filter(perfume => perfume.id !== item.id);
      } catch (error) {
        console.error('Delete perfume failed:', error);
        alert(`刪除失敗：${error.message || '請稍後重試。'}`);
      }
    };

    const archivePerfume = async (item) => {
      if (isArchivingPerfume.value || !historyAvailable.value) {
        if (!historyAvailable.value) alert(historyError.value || '歷史紀錄尚未設定。');
        return;
      }
      if (!window.confirm(`「${item.brand} - ${item.name}」已用罄？確認後會移入歷史紀錄。`)) return;

      isArchivingPerfume.value = true;
      let insertedHistory = null;
      const finishedDate = new Date().toLocaleDateString('sv-SE');
      const archivePayload = {
        user_id: authUser.value?.id,
        original_perfume_id: item.id,
        brand: item.brand,
        name: item.name,
        concentration: item.concentration,
        size_ml: item.size_ml ?? item.sizeMl,
        purchase_date: item.purchase_date || null,
        finished_date: finishedDate,
        rating: item.rating ?? 0,
        seasons: item.seasons || [],
        image: item.imagePath || item.image || null,
        notes: translateScentNotes(item.notes),
      };

      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('perfume_history')
            .insert([archivePayload])
            .select()
            .single();
          if (error) throw error;
          insertedHistory = data;

          const { error: deleteError } = await supabaseClient
            .from('perfumes')
            .delete()
            .eq('id', item.id)
            .eq('user_id', authUser.value.id);
          if (deleteError) throw deleteError;
        } else {
          insertedHistory = { ...archivePayload, id: Date.now() };
        }

        const historyImage = archivePayload.imagePath || (item.imagePath ? await createPerfumeImageUrl(item.imagePath) : item.image);
        perfumeHistory.value.unshift({
          ...archivePayload,
          ...insertedHistory,
          imagePath: item.imagePath || '',
          image: historyImage,
          notes: translateScentNotes(item.notes),
        });
        perfumes.value = perfumes.value.filter(perfume => perfume.id !== item.id);
        currentTab.value = 'history';
      } catch (error) {
        console.error('Archive perfume failed:', error);
        if (insertedHistory?.id && supabaseClient) {
          await supabaseClient
            .from('perfume_history')
            .delete()
            .eq('id', insertedHistory.id)
            .eq('user_id', authUser.value.id);
        }
        alert(`移入歷史紀錄失敗：${error.message || '請稍後重試。'}`);
      } finally {
        isArchivingPerfume.value = false;
      }
    };

    const addMatchToVault = async () => {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('wishlist').insert([
          {
            name: scanResult.value?.matchData?.targetName || '熱門試香',
            brand: scanResult.value?.matchData?.brand || '未知品牌',
            note: scanResult.value?.matchData?.gapAnalysis || 'AI 推薦',
            created_at: new Date().toISOString(),
            user_id: authUser.value?.id,
          }
        ]);
        if (error) {
          console.error('Insert wishlist failed:', error);
          alert(`願望清單新增失敗：${error.message}`);
          return;
        }
      }

      alert('🛒 已登錄新購入香水至典藏庫！');
      currentTab.value = 'vault';
    };

    const addToWishlist = async () => {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('wishlist').insert([{
          name: scanResult.value?.matchData?.targetName || '熱門試香',
          brand: scanResult.value?.matchData?.brand || '未知品牌',
          note: scanResult.value?.matchData?.gapAnalysis || 'AI 推薦',
          user_id: authUser.value?.id,
        }]);
        if (error) {
          alert(`願望清單新增失敗：${error.message}`);
          return;
        }
      }
      alert('📌 已成功加入您的專櫃試香願望清單！');
    };

    const addLog = async () => {
      const p = perfumes.value.find(x => x.id === Number(newLog.value.perfumeId));
      const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString('sv-SE'),
        perfumeName: p ? `${p.brand} - ${p.name}` : '自訂香水',
        sprays: Number(newLog.value.sprays) || 1,
        occasion: newLog.value.occasion
      };

      if (supabaseClient) {
        const { error } = await supabaseClient.from('logs').insert([
          {
            id: record.id,
            date: record.date,
            perfume_name: record.perfumeName,
            sprays: record.sprays,
            occasion: record.occasion,
            created_at: new Date().toISOString(),
            user_id: authUser.value?.id,
          }
        ]);

        if (error) {
          console.error('Insert log failed:', error);
          alert(`穿香紀錄新增失敗：${error.message}`);
          return;
        }
      }

      logs.value.unshift(record);
      alert('✍️ 已記錄今日穿香！');
    };

    const initCharts = () => {
      nextTick(() => {
        const ctx1 = document.getElementById('scentWheelChart');
        const ctx2 = document.getElementById('seasonChart');

        if (chartInstances.wheel) chartInstances.wheel.destroy();
        if (chartInstances.season) chartInstances.season.destroy();

        if (ctx1) {
          chartInstances.wheel = new Chart(ctx1, {
            type: 'radar',
            data: {
              labels: ['木質調', '柑橘調', '花香調', '美食調', '海洋/草本', '東方香調'],
              datasets: [{
                label: '收藏偏好比例',
                data: [85, 60, 40, 70, 30, 75],
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                borderColor: '#D4AF37',
                pointBackgroundColor: '#E5C158'
              }]
            },
            options: {
              plugins: { legend: { display: false } },
              scales: {
                r: {
                  angleLines: { color: 'rgba(255,255,255,0.1)' },
                  grid: { color: 'rgba(255,255,255,0.1)' },
                  pointLabels: { color: '#94a3b8', font: { size: 10 } },
                  ticks: { display: false }
                }
              }
            }
          });
        }

        if (ctx2) {
          chartInstances.season = new Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: ['春季 🌸', '夏季 ☀️', '秋季 🍁', '冬季 ❄️'],
              datasets: [{
                data: [35, 25, 20, 20],
                backgroundColor: ['#f472b6', '#fbbf24', '#fb923c', '#60a5fa']
              }]
            },
            options: {
              plugins: {
                legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
              }
            }
          });
        }
      });
    };

    watch(currentTab, (newTab) => {
      if (newTab === 'analytics') {
        initCharts();
      }
    });

    watch(scanMode, () => {
      scanResult.value = null;
    });

    return {
      currentTab,
      scanMode,
      searchQuery,
      filterSeason,
      perfumes,
      perfumeHistory,
      historyAvailable,
      historyError,
      isArchivingPerfume,
      filteredPerfumes,
      logs,
      newLog,
      isScanning,
      isSavingPerfume,
      scanResult,
      scanError,
      selectedImage,
      selectedImagePreview,
      selectedImageName,
      isSupabaseReady,
      requiresAuth,
      authUser,
      authMode,
      authEmail,
      authPassword,
      authError,
      authMessage,
      isAuthLoading,
      dataError,
      editingPerfume,
      perfumeDraft,
      editError,
      isUpdatingPerfume,
      tabClass,
      scanTabClass,
      filterBtnClass,
      simulateScan,
      handleImageSelection,
      replacePerfumeImage,
      analyzeImage,
      addBoxToVault,
      addMatchToVault,
      addToWishlist,
      addLog,
      openPerfumeEditor,
      closePerfumeEditor,
      savePerfumeEdit,
      deletePerfume,
      archivePerfume,
      submitAuth,
      toggleAuthMode,
      signOut
    };
  }
});

app.mount('#app');
