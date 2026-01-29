export const AESTHETIC_KEYWORDS: Record<string, string> = {
    // Mapping to AESTHETIC_VIBE_OPTIONS
    'minimalist': 'minimal',
    'tối giản': 'minimal',
    'đơn giản': 'minimal',
    'old money': 'old_money',
    'thương gia': 'old_money',
    'streetwear': 'streetwear',
    'đường phố': 'streetwear',
    'casual': 'smart_casual', // Mapping 'casual' generally to smart_casual or business_casual if pure casual isn't an aesthetic option (it's in formality)
    'thường ngày': 'smart_casual',
    'smart casual': 'smart_casual',
    'business': 'business_casual',
    'công sở': 'business_casual',
    'vintage': 'vintage',
    'cổ điển': 'vintage',
    'retro': 'vintage',
    'k-fashion': 'k_fashion',
    'hàn quốc': 'k_fashion',
    'sporty': 'sporty_athleisure',
    'thể thao': 'sporty_athleisure',
    'năng động': 'sporty_athleisure',
    'athleisure': 'sporty_athleisure',
  };
  
  export const OCCASION_KEYWORDS: Record<string, string> = {
    // Mapping to OCCASION_OPTIONS
    'school': 'di_hoc',
    'đi học': 'di_hoc',
    'class': 'di_hoc',
    'work': 'di_lam',
    'đi làm': 'di_lam',
    'văn phòng': 'di_lam',
    'office': 'di_lam',
    'công việc': 'di_lam',
    'cafe': 'di_cafe',
    'cà phê': 'di_cafe',
    'đi cafe': 'di_cafe',
    'play': 'di_cafe',
    'đi chơi': 'di_cafe',
    'date': 'hen_ho',
    'hẹn hò': 'hen_ho',
    'beach': 'di_bien',
    'bãi biển': 'di_bien',
    'biển': 'di_bien',
    'resort': 'di_bien',
    'travel': 'di_bien', // Assuming travel often implies resort/beach or cafe, mapping to beach for vacation vibes or generic
    'du lịch': 'di_bien',
    'party': 'du_tiec',
    'tiệc': 'du_tiec',
    'event': 'du_tiec',
    'sự kiện': 'du_tiec',
    'wedding': 'du_tiec',
    'đám cưới': 'du_tiec',
  };
  
  export const SEASON_KEYWORDS: Record<string, string> = {
    // Mapping to SEASON_OPTIONS
    'spring': 'xuan',
    'xuân': 'xuan',
    'summer': 'ha',
    'hè': 'ha',
    'hạ': 'ha',
    'autumn': 'thu',
    'fall': 'thu',
    'thu': 'thu',
    'winter': 'dong',
    'đông': 'dong',
  };
  
  export const COLOR_KEYWORDS: Record<string, string> = {
    // Mapping to COLOR_PALETTE_OPTIONS
    // neutral_light, black_grey, navy_blue, brown_earth, pastel, bright_colors
    'white': 'neutral_light',
    'trắng': 'neutral_light',
    'beige': 'neutral_light',
    'be': 'neutral_light',
    'cream': 'neutral_light',
    'kem': 'neutral_light',
    'black': 'black_grey',
    'đen': 'black_grey',
    'grey': 'black_grey',
    'xám': 'black_grey',
    'navy': 'navy_blue',
    'xanh đậm': 'navy_blue',
    'xanh dương': 'navy_blue',
    'blue': 'navy_blue', // Broad mapping
    'brown': 'brown_earth',
    'nâu': 'brown_earth',
    'earth': 'brown_earth',
    'đất': 'brown_earth',
    'pastel': 'pastel',
    'nhẹ nhàng': 'pastel',
    'pink': 'pastel', // Could be bright too, but assigning to pastel for now
    'hồng': 'pastel',
    'bright': 'bright_colors',
    'nổi bật': 'bright_colors',
    'red': 'bright_colors',
    'đỏ': 'bright_colors',
    'yellow': 'bright_colors',
    'vàng': 'bright_colors',
    'orange': 'bright_colors',
    'cam': 'bright_colors',
  };

  export const FORMALITY_KEYWORDS: Record<string, string> = {
      'casual': 'casual',
      'thường ngày': 'casual',
      'semi-formal': 'semi_formal',
      'bán chính thức': 'semi_formal',
      'formal': 'formal',
      'trang trọng': 'formal',
      'tiệc': 'formal',
  }
