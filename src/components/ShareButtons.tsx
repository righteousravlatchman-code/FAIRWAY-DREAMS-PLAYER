import React from 'react';
import { Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { useToast } from './ToastProvider';

interface ShareButtonsProps {
  url: string;
  title: string;
  type?: 'track' | 'playlist' | 'artist' | 'album';
}

export function ShareButtons({ url, title, type = 'track' }: ShareButtonsProps) {
  const { showToast } = useToast();

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=Check out this ${type}: ${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copied to clipboard', 'success');
        });
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleShare('twitter')}
        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#1DA1F2] hover:bg-white/10 hover:border-[#1DA1F2]/50 transition-all"
        title="Share on Twitter"
      >
        <Twitter size={14} />
      </button>
      <button 
        onClick={() => handleShare('facebook')}
        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#4267B2] hover:bg-white/10 hover:border-[#4267B2]/50 transition-all"
        title="Share on Facebook"
      >
        <Facebook size={14} />
      </button>
      <button 
        onClick={() => handleShare('copy')}
        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        title="Copy Link"
      >
        <LinkIcon size={14} />
      </button>
    </div>
  );
}
