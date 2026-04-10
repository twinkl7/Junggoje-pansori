import { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { 
  StudentProject, 
  ProjectType,
  UserProfile 
} from './types';
import { 
  generateProjectDescription
} from './services/geminiService';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  LogOut, 
  Users, 
  Heart, 
  ChevronRight, 
  BookOpen, 
  X, 
  Loader2,
  Trash2,
  Edit2,
  Clock,
  Calendar,
  MapPin,
  Layout,
  Sparkles,
  Sun,
  Moon,
  Image as ImageIcon,
  Video,
  AppWindow,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ className, variant = 'primary', size = 'md', ...props }: any) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/10',
    secondary: 'bg-bg-soft text-text-main hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200',
    outline: 'border border-stone-200 dark:border-stone-800 text-text-main dark:text-stone-400 hover:bg-bg-soft dark:hover:bg-stone-900',
    ghost: 'text-text-muted hover:bg-bg-soft dark:hover:bg-stone-800',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    accent: 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  return (
    <button 
      className={cn(
        'rounded-full font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant as keyof typeof variants],
        sizes[size as keyof typeof sizes],
        className
      )} 
      {...props} 
    />
  );
};

const Card = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn('bg-[#fdfcf9] dark:bg-stone-900 rounded-[2rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-stone-100 dark:border-stone-800 overflow-hidden', className)}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-stone-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-text-main dark:text-stone-50 truncate mr-4">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-soft dark:hover:bg-stone-800 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- Mock/Local Persistence ---
const LOCAL_STORAGE_KEY = 'student_projects_v2';
const ADMIN_PASSWORD_KEY = 'admin_password_v1';
const DEFAULT_PASSWORD = 'admin1234';

const getAdminPassword = (): string => {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
};

const setAdminPassword = (password: string) => {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
};

const getLocalProjects = (): StudentProject[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local projects', e);
    }
  }
  return [];
};

const saveLocalProjects = (projects: StudentProject[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    alert('저장 공간이 부족합니다. 오래된 작품을 삭제하거나 이미지를 더 작은 크기로 업로드해주세요.');
  }
};

const INITIAL_PROJECTS: StudentProject[] = [
  {
    id: 'stock-1',
    title: '중고제 풍류 (中古制 風流)',
    description: '풍류객 20분을 정중히 모십니다',
    type: 'Upcoming',
    contentUrl: 'https://example.com/performance/1',
    thumbnailUrl: 'https://picsum.photos/seed/pansori/800/450',
    authorId: 'admin',
    authorName: '운영자',
    sourceMaterialTitle: '중고제 판소리 개요',
    sourceMaterialUrl: 'https://example.com/info',
    performanceDate: '2026-04-18 | 15:00 ~ 17:00',
    performanceLocation: '상림예다원 (대전시 중구 문화동 153-11)',
    locationMapUrl: 'https://map.naver.com/v5/entry/place/11591503',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 12,
    likedBy: []
  },
  {
    id: 'stock-2',
    title: '찾아가는 중고제 소리판 - 대전편',
    description: '시민들과 함께 호흡하는 중고제 판소리 공연입니다. 누구나 쉽게 즐길 수 있는 우리 소리의 매력을 전달합니다.',
    type: 'Past',
    contentUrl: 'https://example.com/performance/2',
    thumbnailUrl: 'https://picsum.photos/seed/korean-music/800/450',
    authorId: 'admin',
    authorName: '운영자',
    sourceMaterialTitle: '지역 예술 활성화 프로젝트',
    sourceMaterialUrl: 'https://example.com/info2',
    performanceDate: '2024년 4월 10일 오후 2시',
    performanceLocation: '대전 무형문화재 전수회관',
    locationMapUrl: 'https://map.naver.com/v5/entry/place/13151457',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    likes: 25,
    likedBy: []
  }
];

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<ProjectType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState<StudentProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<StudentProject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Form State
  const [newProject, setNewProject] = useState<Partial<StudentProject>>({
    type: 'Upcoming',
    title: '',
    description: '',
    contentUrl: '',
    sourceMaterialUrl: '',
    sourceMaterialTitle: '',
    thumbnailUrl: '',
    hashtags: [],
    performanceDate: '',
    performanceLocation: '',
    locationMapUrl: ''
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check before processing
      if (file.size > 5 * 1024 * 1024) { 
        setErrorMessage('이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.');
        e.target.value = '';
        return;
      }

      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Create canvas for compression
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Max dimensions for thumbnail
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Final check for LocalStorage safety (approx 200KB after compression is safe)
            if (compressedDataUrl.length > 300000) {
              setErrorMessage('이미지 압축 후에도 용량이 너무 큽니다. 다른 이미지를 선택해주세요.');
            } else {
              setNewProject(prev => ({ ...prev, thumbnailUrl: compressedDataUrl }));
            }
          } catch (error) {
            console.error('Image processing error:', error);
            setErrorMessage('이미지 처리 중 오류가 발생했습니다.');
          } finally {
            setIsUploadingImage(false);
          }
        };
        img.onerror = () => {
          setErrorMessage('이미지를 불러올 수 없습니다.');
          setIsUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setErrorMessage('파일을 읽는 중 오류가 발생했습니다.');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
      
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  // Mock Auth
  useEffect(() => {
    // Load local projects
    const savedProjects = getLocalProjects();
    if (savedProjects.length === 0) {
      setProjects(INITIAL_PROJECTS);
      saveLocalProjects(INITIAL_PROJECTS);
    } else {
      setProjects(savedProjects);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAdminLoginModalOpen(true);
    setLoginPassword('');
    setLoginError('');
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check for prototype
    if (loginPassword === getAdminPassword()) {
      const mockUser = {
        uid: 'admin-123',
        displayName: '운영자',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin-123`
      };
      setUser(mockUser);
      setProfile({
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        role: 'admin'
      });
      setIsAdminLoginModalOpen(false);
    } else {
      setLoginError('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 4) {
      setPasswordChangeError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setAdminPassword(newPasswordInput);
    setIsChangePasswordModalOpen(false);
    setErrorMessage('비밀번호가 성공적으로 변경되었습니다.');
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
  };

  const handleLike = (project: StudentProject) => {
    if (!user) return;
    const updatedProjects = projects.map(p => {
      if (p.id === project.id) {
        const isLiked = p.likedBy?.includes(user.uid);
        return {
          ...p,
          likes: (p.likes || 0) + (isLiked ? -1 : 1),
          likedBy: isLiked 
            ? p.likedBy?.filter(id => id !== user.uid) 
            : [...(p.likedBy || []), user.uid]
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);
  };

  const handleDelete = (project: StudentProject) => {
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (!projectToDelete) return;

    const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);
    setProjectToDelete(null);
    setSelectedProject(null); // Close detail modal if open
  };

  const handleEdit = (project: StudentProject) => {
    setNewProject({
      type: project.type,
      title: project.title,
      description: project.description,
      contentUrl: project.contentUrl,
      sourceMaterialUrl: project.sourceMaterialUrl,
      sourceMaterialTitle: project.sourceMaterialTitle,
      thumbnailUrl: project.thumbnailUrl,
      hashtags: project.hashtags || [],
      performanceDate: project.performanceDate || '',
      performanceLocation: project.performanceLocation || '',
      locationMapUrl: project.locationMapUrl || ''
    });
    setIsEditing(true);
    setEditingProjectId(project.id!);
    setSelectedProject(null); // Close detail modal if open
    setIsModalOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    if (isEditing && editingProjectId) {
      const updatedProjects = projects.map(p => {
        if (p.id === editingProjectId) {
          return {
            ...p,
            ...newProject,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      setProjects(updatedProjects as StudentProject[]);
      saveLocalProjects(updatedProjects as StudentProject[]);
    } else {
      const project: StudentProject = {
        ...newProject as any,
        id: Math.random().toString(36).substr(2, 9),
        authorId: user.uid,
        authorName: profile.displayName,
        createdAt: new Date().toISOString() as any,
        likes: 0,
        likedBy: []
      };

      const updatedProjects = [project, ...projects];
      setProjects(updatedProjects);
      saveLocalProjects(updatedProjects);
    }
    
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingProjectId(null);
    setNewProject({
      type: 'Upcoming',
      title: '',
      description: '',
      contentUrl: '',
      sourceMaterialUrl: '',
      sourceMaterialTitle: '',
      thumbnailUrl: '',
      hashtags: [],
      performanceDate: '',
      performanceLocation: ''
    });
    setHashtagInput('');
  };

  const handleAiAssist = async () => {
    if (!newProject.description && !newProject.title) {
      alert('아이디어나 간단한 설명을 입력해주세요.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProjectDescription(
        newProject.description || '', 
        newProject.sourceMaterialTitle || ''
      );
      setNewProject(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        type: result.suggestedType as ProjectType
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage('AI 도우미를 불러오는 데 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'All' || p.type === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(searchLower) || 
                          p.authorName.toLowerCase().includes(searchLower) ||
                          p.description.toLowerCase().includes(searchLower) ||
                          p.hashtags?.some(tag => tag.toLowerCase().includes(searchLower.replace('#', '')));
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: ProjectType) => {
    switch (type) {
      case 'Upcoming': return <Clock className="w-4 h-4" />;
      case 'Past': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDarkMode ? "dark bg-stone-950" : "bg-white")}>
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
            </div>

            <div className="hidden md:flex items-center gap-12">
              <a 
                href="https://forms.gle/nRnyTJw9Ayan8Chj7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                후원자 등록
              </a>
              {profile?.role === 'admin' ? (
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                      setIsChangePasswordModalOpen(true);
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setPasswordChangeError('');
                    }}
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    비밀번호 변경
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  관리자 로그인
                </button>
              )}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-white/80 hover:text-white"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-4 md:hidden">
              {profile?.role === 'admin' ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setIsChangePasswordModalOpen(true);
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setPasswordChangeError('');
                    }}
                    className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                  >
                    PW변경
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                  관리자
                </button>
              )}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-white/80 hover:text-white"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        <main className="relative">
          {/* Hero Section */}
          <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2070" 
                alt="Majestic Mountain Lake" 
                className="w-full h-full object-cover grayscale brightness-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-8">
                  <span className="text-white/90 text-sm font-medium tracking-widest">중고제 풍류</span>
                </div>
                
                <h2 className="text-4xl sm:text-6xl font-display font-bold text-white mb-8 tracking-tight">
                  중고제 풍류
                </h2>
                
                <div className="text-sm sm:text-base text-white/80 mb-12 font-light tracking-wide max-w-3xl mx-auto space-y-6">
                  <p>
                    <span className="font-bold text-white">중고제</span>(中古制)는 충청도와 경기도 남부 지역을 중심으로 전승되어 온 가장 오래된 소리제입니다. 담백하고 정갈하며, 기품 있는 소리가 특징입니다.
                  </p>
                  <p className="text-sm sm:text-base opacity-90">
                    <span className="font-bold text-white">'중고제 풍류'</span>는 소중한 문화유산인 중고제를 복원하고, 현대인들에게 옛 사랑방의 공연 문화의 깊은 울림을 전하기 위해 시작되었습니다. 경기, 충청지역의 전통 문화를 즐기며 공연자와 관객들이 함께 교류하는 시간을 마련하고자 합니다.
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-white/70 pt-4">
                    주최: 운영자 / 대전향제줄풍류보존회 / 상림예다원
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-10 py-4 bg-white text-black hover:bg-white/90 rounded-full font-bold text-base shadow-2xl"
                    onClick={() => {
                      const element = document.getElementById('projects-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    공연 정보 보기
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-4 border-white/30 text-white hover:bg-white/10 rounded-full font-bold text-base backdrop-blur-sm"
                      onClick={() => setIsModalOpen(true)}
                    >
                      프로그램 작성
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          <div id="projects-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-8 mb-12 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
              {(['All', 'Upcoming', 'Past'] as const).map((t) => {
                const labels: Record<string, string> = {
                  All: '전체',
                  Upcoming: '예정 공연',
                  Past: '지난 공연'
                };
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-6 py-2.5 rounded-md text-sm font-bold transition-all whitespace-nowrap",
                      filter === t 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-white text-text-muted dark:bg-stone-900 dark:text-stone-400 hover:bg-bg-soft dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800"
                    )}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-24 bg-bg-soft dark:bg-stone-900 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
              <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-2xl font-bold text-text-main dark:text-stone-50 mb-2">프로그램을 찾을 수 없습니다</h3>
              <p className="text-text-muted">검색어나 필터를 변경해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card 
                      className="group h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                        {(user?.uid === project.authorId || profile?.role === 'admin') && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(project);
                              }}
                              className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                              title="수정"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project);
                              }}
                              className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="relative aspect-video mb-6 rounded-md overflow-hidden bg-bg-soft dark:bg-stone-800">
                        {project.thumbnailUrl ? (
                          <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted/30">
                            {getIcon(project.type)}
                          </div>
                        )}
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm text-primary">
                          {getIcon(project.type)}
                          {(() => {
                            const labels: Record<string, string> = {
                              Upcoming: '예정 공연',
                              Past: '지난 공연'
                            };
                            return labels[project.type] || project.type;
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex-1 text-center relative">
                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-text-main dark:text-stone-50 mb-4 tracking-tight pt-2 break-keep">
                          {project.title}
                        </h3>
                        
                        <p className="text-base sm:text-lg text-text-muted dark:text-stone-400 mb-8 leading-relaxed font-light break-keep">
                          {project.description}
                        </p>

                        <div className="space-y-2 mb-8 text-stone-700 dark:text-stone-300 font-medium tracking-wide">
                          {project.performanceDate && (
                            <p className="text-sm sm:text-base break-keep">{project.performanceDate}</p>
                          )}
                          {project.performanceLocation && (
                            <p className="text-sm sm:text-base break-keep">{project.performanceLocation}</p>
                          )}
                        </div>

                        {project.hashtags && project.hashtags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                            {project.hashtags.map((tag, i) => (
                              <span key={i} className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-6 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.authorId}`} className="w-8 h-8 rounded-xl bg-bg-soft grayscale hover:grayscale-0 transition-all flex-shrink-0" alt={project.authorName} />
                          <span className="text-xs font-bold text-text-main dark:text-stone-300 tracking-wide truncate">{project.authorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(project);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                              project.likedBy?.includes(user?.uid || '') 
                                ? "bg-red-50 text-red-500" 
                                : "text-text-muted hover:bg-bg-soft"
                            )}
                          >
                            <Heart className={cn("w-3.5 h-3.5", project.likedBy?.includes(user?.uid || '') && "fill-current")} />
                            {project.likes}
                          </button>
                        </div>
                      </div>
                      
                      {project.sourceMaterialTitle && (
                        <div className="mt-4 text-[10px] text-text-muted/60 font-medium flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          정보: {project.sourceMaterialTitle}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          </div>
        </main>

        {/* Create Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setIsEditing(false);
            setEditingProjectId(null);
              setNewProject({
                type: 'Upcoming',
                title: '',
                description: '',
                contentUrl: '',
                sourceMaterialUrl: '',
                sourceMaterialTitle: '중고제 판소리 개요',
                thumbnailUrl: '',
                hashtags: [],
                performanceDate: '',
                performanceLocation: '',
                locationMapUrl: ''
              });
          }} 
          title={isEditing ? "프로그램 수정하기" : "프로그램 등록"}
        >
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">프로그램 유형</label>
                <select 
                  value={newProject.type}
                  onChange={(e) => setNewProject({...newProject, type: e.target.value as ProjectType})}
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                >
                  <option value="Upcoming">예정 공연</option>
                  <option value="Past">지난 공연</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">프로그램 제목</label>
                <input 
                  type="text" 
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  placeholder="프로그램 제목을 입력하세요"
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">프로그램 설명</label>
                <button 
                  type="button"
                  onClick={handleAiAssist}
                  disabled={isGenerating}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:text-primary-dark disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI 도우미 (제목/설명 생성)
                </button>
              </div>
              <textarea 
                required
                rows={4}
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="프로그램에 대한 아이디어나 설명을 입력하세요. AI 도우미를 통해 다듬을 수 있습니다."
                className="w-full px-4 py-3 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 resize-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main dark:text-stone-300">썸네일 이미지</label>
              <div className="flex items-center gap-4">
                <div className="relative w-32 aspect-video rounded-2xl overflow-hidden bg-bg-soft dark:bg-stone-800 border border-stone-100 flex items-center justify-center">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : newProject.thumbnailUrl ? (
                    <img src={newProject.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-text-muted/30" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    <label 
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm font-bold text-text-main dark:text-stone-300 hover:bg-bg-soft transition-all"
                    >
                      <ImageIcon className="w-4 h-4" /> 이미지 선택
                    </label>
                    <input 
                      id="thumbnail-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleThumbnailUpload} 
                      className="hidden" 
                    />
                    {newProject.thumbnailUrl && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={() => setNewProject(prev => ({ ...prev, thumbnailUrl: '' }))}
                      >
                        이미지 제거
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted mt-1.5 font-medium">1MB 이하의 이미지를 권장합니다.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">공연 일시</label>
                <input 
                  type="text" 
                  value={newProject.performanceDate}
                  onChange={(e) => setNewProject({...newProject, performanceDate: e.target.value})}
                  placeholder="예: 2024년 5월 20일 오후 7시"
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">공연 장소</label>
                <input 
                  type="text" 
                  value={newProject.performanceLocation}
                  onChange={(e) => setNewProject({...newProject, performanceLocation: e.target.value})}
                  placeholder="예: 상림예다원 (대전시 중구 문화동 153-11)"
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main dark:text-stone-300">네이버 지도 링크 (URL)</label>
              <input 
                type="url" 
                value={newProject.locationMapUrl}
                onChange={(e) => setNewProject({...newProject, locationMapUrl: e.target.value})}
                placeholder="https://map.naver.com/..."
                className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">관련 정보 제목</label>
                <input 
                  type="text" 
                  value={newProject.sourceMaterialTitle}
                  onChange={(e) => setNewProject({...newProject, sourceMaterialTitle: e.target.value})}
                  placeholder="예: 중고제 판소리 개요"
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main dark:text-stone-300">자세히 보기 링크 (URL)</label>
                <input 
                  type="url" 
                  value={newProject.sourceMaterialUrl}
                  onChange={(e) => setNewProject({...newProject, sourceMaterialUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main dark:text-stone-300">참여 신청 링크 (URL)</label>
              <input 
                type="url" 
                required
                value={newProject.contentUrl}
                onChange={(e) => setNewProject({...newProject, contentUrl: e.target.value})}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-stone-50 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => {
                setIsModalOpen(false);
                setIsEditing(false);
                setEditingProjectId(null);
                setNewProject({
                  type: 'Upcoming',
                  title: '',
                  description: '',
                  contentUrl: '',
                  sourceMaterialUrl: '',
                  sourceMaterialTitle: '중고제 판소리 개요',
                  thumbnailUrl: '',
                  hashtags: [],
                  performanceDate: '',
                  performanceLocation: '',
                  locationMapUrl: ''
                });
              }}>취소</Button>
              <Button type="submit" className="flex-[2]" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? '수정 완료' : '등록하기')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Project Detail Modal */}
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject?.title || ''}
        >
          {selectedProject && (
            <div className="space-y-8">
              <div className="aspect-video rounded-lg overflow-hidden bg-bg-soft dark:bg-stone-800 border border-stone-100 dark:border-stone-800">
                {selectedProject.thumbnailUrl ? (
                  <img src={selectedProject.thumbnailUrl} alt={selectedProject.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted/20">
                    {getIcon(selectedProject.type)}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProject.authorId}`} className="w-12 h-12 rounded-2xl bg-bg-soft flex-shrink-0" alt={selectedProject.authorName} />
                  <div className="min-w-0">
                    <p className="font-bold text-text-main dark:text-stone-50 truncate">{selectedProject.authorName}</p>
                    <p className="text-xs text-text-muted font-medium">{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    {(user?.uid === selectedProject.authorId || profile?.role === 'admin') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl flex items-center gap-1.5 h-9"
                          onClick={() => handleEdit(selectedProject)}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> 수정
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="rounded-xl flex items-center gap-1.5 h-9"
                          onClick={() => handleDelete(selectedProject)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 삭제
                        </Button>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => handleLike(selectedProject)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all font-bold text-sm h-9",
                      selectedProject.likedBy?.includes(user?.uid || '') 
                        ? "bg-red-50 border-red-100 text-red-500" 
                        : "border-stone-100 text-text-muted hover:bg-bg-soft"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", selectedProject.likedBy?.includes(user?.uid || '') && "fill-current")} />
                    {selectedProject.likes}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-bg-soft dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] text-text-muted uppercase font-black mb-1">공연 일시</p>
                  <p className="text-sm font-bold text-text-main dark:text-stone-100">{selectedProject.performanceDate || '정보 없음'}</p>
                </div>
                <div className="p-4 bg-bg-soft dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] text-text-muted uppercase font-black mb-1">공연 장소</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-text-main dark:text-stone-100">{selectedProject.performanceLocation || '정보 없음'}</p>
                    {selectedProject.locationMapUrl && (
                      <a 
                        href={selectedProject.locationMapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        네이버 지도 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">프로그램 설명</h4>
                <p className="text-text-main dark:text-stone-300 leading-relaxed whitespace-pre-wrap text-base mb-4">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.sourceMaterialTitle && (
                <div className="p-8 bg-bg-soft dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800">
                  <h4 className="text-sm font-bold text-text-main dark:text-stone-50 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> 관련 정보
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted dark:text-stone-400 font-medium">{selectedProject.sourceMaterialTitle}</span>
                    {selectedProject.sourceMaterialUrl && (
                      <a 
                        href={selectedProject.sourceMaterialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary dark:text-stone-200 hover:text-primary-dark text-sm font-bold flex items-center gap-1.5 transition-colors"
                      >
                        자세히 보기 <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
                <a href={selectedProject.contentUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full">
                    참여 신청하러 가기 <ExternalLink className="w-5 h-5" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          title="프로그램 삭제"
        >
          <div className="space-y-6">
            <p className="text-text-main dark:text-stone-300">
              정말로 <span className="font-bold text-primary">'{projectToDelete?.title}'</span> 프로그램을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setProjectToDelete(null)}>
                취소
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete}>
                삭제하기
              </Button>
            </div>
          </div>
        </Modal>

        {/* Error Message Modal */}
        <Modal
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="알림"
        >
          <div className="space-y-6">
            <p className="text-text-main dark:text-stone-300">{errorMessage}</p>
            <Button className="w-full" onClick={() => setErrorMessage(null)}>
              확인
            </Button>
          </div>
        </Modal>

        {/* Admin Login Modal */}
        <Modal
          isOpen={isAdminLoginModalOpen}
          onClose={() => setIsAdminLoginModalOpen(false)}
          title="관리자 로그인"
        >
          <form onSubmit={handleAdminLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-main dark:text-stone-300 mb-2">
                관리자 비밀번호
              </label>
              <input 
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="비밀번호를 입력하세요"
                autoFocus
              />
              {loginError && (
                <p className="text-red-500 text-xs mt-2 font-medium">{loginError}</p>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full">
                로그인
              </Button>
            </div>
          </form>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          title="관리자 비밀번호 변경"
        >
          <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-main dark:text-stone-300 mb-2">
                  새 비밀번호
                </label>
                <input 
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="최소 4자 이상"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main dark:text-stone-300 mb-2">
                  비밀번호 확인
                </label>
                <input 
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
              {passwordChangeError && (
                <p className="text-red-500 text-xs font-medium">{passwordChangeError}</p>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full">
                비밀번호 변경하기
              </Button>
            </div>
          </form>
        </Modal>

        {/* Footer */}
        <footer className="bg-primary py-24 mt-32 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md text-accent rounded-md flex items-center justify-center border border-white/10">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-serif font-bold tracking-tight">중고제 풍류 후원 안내</span>
            </div>
            <div className="text-stone-400 text-base mb-12 leading-relaxed max-w-2xl mx-auto font-light space-y-4">
              <p className="text-white font-bold text-lg">대전, 충청의 자랑스러운 지역 예술, 중고제 ‘패트론(Patron)’이 되어주세요.</p>
              <ul className="list-disc list-inside text-left inline-block">
                <li>50만원: ‘중고제 풍류’ 2회 무료 초대 및 VIP 회원 등록. 학술총서 증정</li>
                <li>100만원 이상: ‘중고제 풍류’ 1년 무료 초대 및 VIP 회원 등록. 학술총서 증정</li>
              </ul>
              <p className="mt-4">후원 계좌: 카카오뱅크 3333-26-0729283 (예금주: 김선현)</p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <a 
                href="https://forms.gle/nRnyTJw9Ayan8Chj7" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="accent" className="px-10 !text-primary font-bold">
                  후원자 등록하기
                </Button>
              </a>
            </div>
          </div>
        </footer>
      </div>
  );
}
