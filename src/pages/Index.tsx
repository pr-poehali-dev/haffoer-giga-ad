import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  type: 'photo' | 'video';
  url: string;
  title: string;
  timestamp: number;
}

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [ads, setAds] = useState<Ad[]>([]);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const ADMIN_PASSWORD = 'haffoer2024';

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

  const handleCreateAd = () => {
    if (!selectedFile || !newAdTitle) {
      toast({
        title: '✗ Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    const fileUrl = URL.createObjectURL(selectedFile);
    const newAd: Ad = {
      id: Date.now().toString(),
      type: selectedFile.type.startsWith('video/') ? 'video' : 'photo',
      url: fileUrl,
      title: newAdTitle,
      timestamp: Date.now(),
    };

    setAds([newAd, ...ads]);
    setNewAdTitle('');
    setSelectedFile(null);

    toast({
      title: '✓ Реклама создана',
      description: 'Опубликована и доступна пользователям',
    });
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
                    Пароль: haffoer2024
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="hover-scale hover-glow">
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
                    <Button onClick={handleCreateAd} className="w-full">
                      <Icon name="Upload" className="mr-2" size={18} />
                      Опубликовать
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
                <Icon name="Eye" className="mr-2" size={20} />
                Просмотр сайта
              </Button>
            </>
          )}
        </div>

        {ads.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Icon name="Sparkles" size={40} className="text-primary" />
            </div>
            <h2 className="font-heading text-3xl font-bold mb-4">
              Реклама появится здесь
            </h2>
            <p className="text-muted-foreground text-lg">
              {isAdmin
                ? 'Создайте первую рекламу через админ-панель'
                : 'Пока нет опубликованных материалов'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad, index) => (
              <Card
                key={ad.id}
                className="overflow-hidden hover-scale hover-glow animate-scale-in border-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {ad.type === 'video' ? (
                    <video
                      src={ad.url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={ad.url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      {ad.type === 'video' ? '🎬 Видео' : '📸 Фото'}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-xl font-bold mb-2">{ad.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(ad.timestamp).toLocaleString('ru-RU')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
