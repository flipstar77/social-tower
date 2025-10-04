/**
 * YouTube Channels Configuration
 * Centralized channel definitions for both server and client
 */

const YOUTUBE_CHANNELS = [
    {
        name: 'GreenyTower',
        handle: '@GreenyTower',
        channelId: 'UCeuO60YTS9WwOl1yAi6Qn9Q',
        color: '#4CAF50'
    },
    {
        name: 'CrowbarZero',
        handle: '@crowbarzero',
        channelId: 'UCWtEZ--dMr3lUlRG8rrvRsg',
        color: '#FF5722'
    },
    {
        name: 'AllClouded',
        handle: '@AllClouded',
        channelId: 'UCcpn3WSlVU5IRs7SPiuozjQ',
        color: '#2196F3'
    },
    {
        name: 'SpartanTheTower',
        handle: '@SpartanTheTower',
        channelId: 'UCJltNBPDx7H9LH0csP5ELXQ',
        color: '#9C27B0'
    },
    {
        name: 'Taggzrd',
        handle: '@taggzrd',
        channelId: 'UCybEHrV8WZ0RGyRQbM-MZEA',
        color: '#FF9800'
    },
    {
        name: 'JPlays1',
        handle: '@JPlays1',
        channelId: 'UCOtehYd4CVXI7BPJw2UfSOg',
        color: '#795548'
    },
    {
        name: 'JeffP978',
        handle: '@JeffP978',
        channelId: 'UCQTs9ZTFsUCGlorb9OWJHvQ',
        color: '#607D8B'
    },
    {
        name: 'EthanDX',
        handle: '@EthanDX',
        channelId: 'UC6cbwoNCQ4FhTJhXGg3Vy3A',
        color: '#E91E63'
    },
    {
        name: 'FungulusMaximus',
        handle: '@fungulusmaximus',
        channelId: 'UC98T7zt-DiGj0mIPBYQu88g',
        color: '#8BC34A'
    },
    {
        name: 'TequilaMan7',
        handle: '@tequilaman7',
        channelId: 'UC6M_dnTgqG_4mqNHoq_if1w',
        color: '#FFC107'
    },
    {
        name: 'DizzyProjectRend',
        handle: '@dizzy-project-rend',
        channelId: 'UC5NwLlR639GehQxq9ulDNxQ',
        color: '#00BCD4'
    },
    {
        name: 'Noobodytest',
        handle: '@Noobodytest',
        channelId: 'UCgUKiyX42qmzoCpNHIluKpw',
        color: '#673AB7'
    },
    {
        name: 'PrimosTower',
        handle: '@PrimosTower',
        channelId: 'UCE66fvcWg0QxyEBwVpKrjtg',
        color: '#3F51B5'
    },
    {
        name: 'LyconaGaming',
        handle: '@LyconaGaming-n7o',
        channelId: 'UCgajZWXHKq-xSu42X_tX30A',
        color: '#FF5722'
    },
    {
        name: 'AnornaSharnath',
        handle: '@Anorna-Sharnath',
        channelId: 'UC_6K5wzi9_gmCYu-OZbNwcg',
        color: '#FF6B6B'
    },
    {
        name: 'ShadoSabre',
        handle: '@ShadoSabre',
        channelId: 'UC0tjziI8zi7XZaj69FJaisQ',
        color: '#1A1A2E'
    },
    {
        name: '1234bruhTheTower',
        handle: '@1234bruhTheTower',
        channelId: 'UCG_siFCi2PkOXeSprGI1vXg',
        color: '#9E9E9E'
    },
    {
        name: 'jamn4evr',
        handle: '@jamn4evr',
        channelId: 'UCvoytBFsFuIzBgtUrNdYKpw',
        color: '#FF6B35'
    }
];

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YOUTUBE_CHANNELS };
} else {
    window.YOUTUBE_CHANNELS = YOUTUBE_CHANNELS;
}
