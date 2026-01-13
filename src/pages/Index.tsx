import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: number;
  type: 'photo' | 'video';
  url: string;
  title: string;
  description: string;
  created_at: string;
  views: number;
  likes: number;
  user_liked?: boolean;
  user_viewed?: boolean;
}

const API_URL = 'https://functions.poehali.dev/c30b8851-56aa-4fa3-89f2-77974bdb80b3';

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [ads, setAds] = useState<Ad[]>([]);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDescription, setNewAdDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userIdRef = useRef('user_' + Math.random().toString(36).substr(2, 9));

  const ADMIN_PASSWORD = 'haffoer1JE';

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await fetch(`${API_URL}?action=list`, {
        headers: {
          'X-User-Id': userIdRef.current
        }
      });
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      toast({
        title: '✓ Вход выполнен',
        description: 'Добро пожаловать в админ-панель',
      });
    } else {
      toast({
        title: '✗ Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: '✗ Ошибка',
          description: 'Выберите фото или видео',
          variant: 'destructive',
        });
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateAd = async () => {
    if (!selectedFile || !newAdTitle || !newAdDescription) {
      toast({
        title: '✗ Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const fileData = await fileToBase64(selectedFile);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userIdRef.current
        },
        body: JSON.stringify({
          fileData,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          title: newAdTitle,
          description: newAdDescription
        })
      });

      if (response.ok) {
        setNewAdTitle('');
        setNewAdDescription('');
        setSelectedFile(null);
        setDialogOpen(false);
        
        await loadAds();
        
        toast({
          title: '✓ Реклама создана',
          description: 'Опубликована и доступна всем пользователям',
        });
      } else {
        throw new Error('Failed to create ad');
      }
    } catch (error) {
      toast({
        title: '✗ Ошибка',
        description: 'Не удалось создать рекламу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userIdRef.current
        }
      });

      if (response.ok) {
        await loadAds();
        toast({
          title: '✓ Удалено',
          description: 'Реклама успешно удалена',
        });
      }
    } catch (error) {
      toast({
        title: '✗ Ошибка',
        description: 'Не удалось удалить рекламу',
        variant: 'destructive',
      });
    }
  };

  const handleViewAd = async (id: number) => {
    const ad = ads.find(a => a.id === id);
    if (ad?.user_viewed) return;

    try {
      const response = await fetch(`${API_URL}?action=view&id=${id}`, {
        method: 'PUT',
        headers: {
          'X-User-Id': userIdRef.current
        }
      });

      if (response.ok) {
        await loadAds();
      }
    } catch (error) {
      console.error('Failed to update view:', error);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}?action=like&id=${id}`, {
        method: 'PUT',
        headers: {
          'X-User-Id': userIdRef.current
        }
      });

      if (response.ok) {
        await loadAds();
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center animate-fade-in">
          <h1 className="font-heading text-5xl md:text-7xl font-extrabold mb-4 gradient-text">
            Haffoer & Giga
          </h1>
          <p className="text-xl text-muted-foreground">Платформа креативной рекламы</p>
        </header>

        <div className="flex justify-center gap-4 mb-12">
          {!isAdmin ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="hover-scale hover-glow">
                  <Icon name="Lock" className="mr-2" size={20} />
                  Админ-панель
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl gradient-text">
                    Вход в админ-панель
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Введите пароль"
                    />
                  </div>
                  <Button onClick={handleLogin} className="w-full">
                    Войти
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Пароль: haffoer1JE
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="hover-scale hover-glow" disabled={loading}>
                    <Icon name="Plus" className="mr-2" size={20} />
                    Создать рекламу
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl gradient-text">
                      Новая реклама
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Название</Label>
                      <Input
                        id="title"
                        value={newAdTitle}
                        onChange={(e) => setNewAdTitle(e.target.value)}
                        placeholder="Название рекламы"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        value={newAdDescription}
                        onChange={(e) => setNewAdDescription(e.target.value)}
                        placeholder="Опишите вашу рекламу"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">Фото или видео</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Выбрано: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <Button onClick={handleCreateAd} className="w-full" disabled={loading}>
                      <Icon name="Upload" className="mr-2" size={18} />
                      {loading ? 'Загрузка...' : 'Опубликовать'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsAdmin(false)}
                className="hover-scale"
              >
                <Icon name="LogOut" className="mr-2" size={20} />
                Выйти
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.map((ad) => (
            <Card
              key={ad.id}
              className="group overflow-hidden hover-scale border-2 transition-all duration-300 hover:border-primary"
            >
              <div className="relative aspect-video bg-muted">
                {ad.type === 'video' ? (
                  <video
                    src={ad.url}
                    className="w-full h-full object-cover"
                    controls
                    onPlay={() => handleViewAd(ad.id)}
                  />
                ) : (
                  <img
                    src={ad.url}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onLoad={() => handleViewAd(ad.id)}
                  />
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-heading text-xl font-bold mb-2 gradient-text">
                    {ad.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {ad.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(ad.id)}
                      className={ad.user_liked ? 'text-red-500' : ''}
                    >
                      <Icon name={ad.user_liked ? 'Heart' : 'Heart'} className="mr-1" size={18} />
                      {ad.likes}
                    </Button>
                    <div className="flex items-center text-muted-foreground">
                      <Icon name="Eye" className="mr-1" size={18} />
                      <span className="text-sm">{ad.views}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAd(ad.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Icon name="Trash2" size={18} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {ads.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <Icon name="Film" className="mx-auto mb-4 text-muted-foreground" size={64} />
            <h3 className="font-heading text-2xl font-bold mb-2 gradient-text">
              Пока нет объявлений
            </h3>
            <p className="text-muted-foreground">
              {isAdmin ? 'Создайте первое рекламное объявление' : 'Скоро здесь появится реклама'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
