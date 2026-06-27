import { FlutterCodePreset } from '../types';

export function getFlutterMainCode(preset: FlutterCodePreset, accountName: string, coins: number): string {
  const primaryColor = preset.primaryColorHex;
  const accentColor = preset.accentColorHex;

  return `// main.dart
import 'package:flutter/material.dart';
import 'theme.dart';
import 'notes_dashboard.dart';

void main() {
  runApp(const NotesApp());
}

class NotesApp extends StatefulWidget {
  const NotesApp({Key? key}) : super(key: key);

  @override
  State<NotesApp> createState() => _NotesAppState();
}

class _NotesAppState extends State<NotesApp> {
  int _premiumCoins = ${coins};
  String _accountName = '${accountName}';

  void _updateCoins(int amount) {
    setState(() {
      _premiumCoins += amount;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Notes App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      home: NotesDashboardScreen(
        accountName: _accountName,
        premiumCoins: _premiumCoins,
        isDarkMode: true,
        onToggleTheme: () {}, // No-op as light mode is removed
        onAddCoins: () => _updateCoins(10),
      ),
    );
  }
}
`;
}

export function getFlutterThemeCode(preset: FlutterCodePreset): string {
  const primaryColor = preset.primaryColorHex.replace('#', '0xFF');
  const accentColor = preset.accentColorHex.replace('#', '0xFF');
  const darkBg = preset.darkBgColorHex.replace('#', '0xFF');

  return `// theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  // Gate.io Inspired Color Palette
  static const Color primaryBlue = Color(${primaryColor}); // Deep Slate Blue
  static const Color vibrantGreen = Color(${accentColor}); // Gate.io Green
  
  static const Color darkBackground = Color(${darkBg}); // Dark Charcoal
  
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: primaryBlue,
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: vibrantGreen,
        secondary: primaryBlue,
        background: darkBackground,
        surface: Color(0xFF1E293B), // Dark Card Blueish-Slate
        onPrimary: Colors.black,
        onSecondary: Colors.white,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontSize: 24, 
          fontWeight: FontWeight.bold, 
          color: Colors.white,
          letterSpacing: 0.5,
        ),
        titleMedium: TextStyle(
          fontSize: 16, 
          fontWeight: FontWeight.w600, 
          color: Colors.white70,
        ),
        bodyMedium: TextStyle(
          fontSize: 14, 
          color: Colors.white60,
        ),
      ),
      cardTheme: CardTheme(
        color: const Color(0xFF1E293B),
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
`;
}

export function getFlutterNotesDashboardCode(preset: FlutterCodePreset): string {
  const primaryColor = preset.primaryColorHex.replace('#', '0xFF');
  const accentColor = preset.accentColorHex.replace('#', '0xFF');

  return `// notes_dashboard.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'note_editor_screen.dart';
import 'theme.dart';

class NotesDashboardScreen extends StatefulWidget {
  final String accountName;
  final int premiumCoins;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;
  final VoidCallback onAddCoins;

  const NotesDashboardScreen({
    Key? key,
    required this.accountName,
    required this.premiumCoins,
    required this.isDarkMode,
    required this.onToggleTheme,
    required this.onAddCoins,
  }) : super(key: key);

  @override
  State<NotesDashboardScreen> createState() => _NotesDashboardScreenState();
}

class _NotesDashboardScreenState extends State<NotesDashboardScreen> {
  int _currentTab = 0; // 0: Home, 1: Shop, 2: Setting

  // Sample hardcoded notes in the primary central area
  final List<Map<String, String>> _sampleNotes = [
    {
      'title': 'Gate.io Design Spec',
      'desc': 'Brand Palette aligns with Deep Slate Blue & Vibrant Emerald Green...',
      'date': 'Jun 18, 10:45 AM'
    },
    {
      'title': 'Crypto Strategy Draft',
      'desc': 'Portfolio targets blue-chips and liquid assets on primary mainnets...',
      'date': 'Jun 17, 8:15 PM'
    },
    {
      'title': 'Flutter Android Widget Tree',
      'desc': 'Implement gorgeous layout with rounded navigation floating panels...',
      'date': 'Jun 15, 2:30 PM'
    }
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. TOP HEADER (Account Details, Premium Coins indicator)
              _buildTopHeader(theme),
              
              const SizedBox(height: 16),
              
              // Center Header Title label: "Notes"
              Center(
                child: Text(
                  'Notes',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              
              const SizedBox(height: 20),

              // 2. MAIN CONTENT AREA (Clickable Notes Display Area occupies 2/3, Quick Links occupies 1/3)
              Expanded(
                child: _currentTab == 0
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            flex: 2,
                            child: _buildNotesDashboardArea(theme),
                          ),
                          const SizedBox(height: 12),
                          Expanded(
                            flex: 1,
                            child: _buildQuickLinks(theme),
                          ),
                        ],
                      )
                    : _currentTab == 1
                        ? _buildShopScreen(theme)
                        : _buildSettingsScreen(theme),
              ),

              const SizedBox(height: 16),

              // 4. BOTTOM NAVIGATION BAR (Floating Pill capsules style per Wireframe)
              _buildBottomFloatingNavBar(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopHeader(ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Account Details (Left Side)
        Row(
          children: [
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Account details modifier tapped!')),
                );
              },
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [AppTheme.vibrantGreen, Color(0xFF009F6E)],
                  ),
                  border: Border.all(color: Colors.white.withOpacity(0.45), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                    BoxShadow(
                      color: Colors.white.withOpacity(0.35),
                      blurRadius: 3,
                      offset: const Offset(0, -1),
                    )
                  ],
                ),
                child: const Icon(Icons.person, color: Colors.white, size: 18),
              ),
            ),
            const SizedBox(width: 8),
            // 3D Name tag container
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [AppTheme.vibrantGreen, Color(0xFF009F6E)],
                ),
                border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Text(
                widget.accountName.toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.w950, 
                  fontSize: 9.5,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),

        // 3D Premium Coins Badge (Right Side)
        GestureDetector(
          onTap: widget.onAddCoins,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFFBBF24), Color(0xFFD97706)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.5), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.5),
                  blurRadius: 3,
                  offset: const Offset(0, -1),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.monetization_on, color: Colors.amberAccent, size: 14),
                const SizedBox(width: 4),
                Text(
                  '+\${widget.premiumCoins}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNotesDashboardArea(ThemeData theme) {
    return GestureDetector(
      onTap: () {
        // Navigate with transition to Note Editor Screen Page
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => NoteEditorScreen(
              accountName: widget.accountName,
              premiumCoins: widget.premiumCoins,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: widget.isDarkMode 
              ? Colors.white.withOpacity(0.04) 
              : Colors.black.withOpacity(0.02),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: widget.isDarkMode ? Colors.white12 : Colors.black12,
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Saved Drafts',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Icon(
                  Icons.edit_note,
                  color: AppTheme.vibrantGreen,
                  size: 26,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Expanded(
              child: RawScrollbar(
                thumbColor: AppTheme.vibrantGreen.withOpacity(0.85),
                trackColor: const Color(0xFF0B1528),
                trackVisibility: true,
                radius: const Radius.circular(999),
                thickness: 6,
                interactive: true,
                thumbVisibility: true,
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(right: 6),
                  itemCount: _sampleNotes.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final note = _sampleNotes[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: widget.isDarkMode ? Colors.white10 : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: widget.isDarkMode 
                          ? [] 
                          : [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Wireframe horizontal line metaphor styled elegantly as note rows
                        Container(
                          width: double.infinity,
                          height: 5,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(2.5),
                            color: index % 2 == 0 ? AppTheme.vibrantGreen : AppTheme.primaryBlue,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          note['title']!,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          note['desc']!,
                          style: TextStyle(fontSize: 13, color: widget.isDarkMode ? Colors.white60 : Colors.black54),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
                },
                ),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              '⚡ Tap Box to open Editor & write custom notes',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppTheme.vibrantGreen),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickLinks(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'QUICK LINKS',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 9,
            letterSpacing: 0.8,
            color: Colors.white54,
          ),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: widget.isDarkMode 
                  ? Colors.white.withOpacity(0.02) 
                  : Colors.black.withOpacity(0.04),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: widget.isDarkMode ? Colors.white12 : Colors.black12,
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSmallCircleButton(
                  icon: Icons.facebook,
                  label: 'Share',
                  colors: [const Color(0xFF1877F2), const Color(0xFF166FE5)],
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Sharing active draft on Facebook...')),
                    );
                  },
                ),
                _buildSmallCircleButton(
                  icon: Icons.chat_bubble_outline,
                  label: 'AI Chat',
                  colors: [AppTheme.vibrantGreen, const Color(0xFF009F6E)],
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Opening AI Copilot...')),
                    );
                  },
                ),
                _buildSmallCircleButton(
                  icon: Icons.copy_all_rounded,
                  label: 'Copy',
                  colors: [const Color(0xFFFBBF24), const Color(0xFFD97706)],
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied notes to clipboard!')),
                    );
                  },
                ),
                _buildSmallCircleButton(
                  icon: Icons.add_circle_outline_rounded,
                  label: 'New Draft',
                  colors: [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Opening new note draft...')),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSmallCircleButton({
    required IconData icon,
    required String label,
    required List<Color> colors,
    required VoidCallback onTap,
  }) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: colors,
              ),
              border: Border.all(color: Colors.white.withOpacity(0.45), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 5,
                  offset: const Offset(0, 3),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.25),
                  blurRadius: 2,
                  offset: const Offset(0, -1),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 15),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 8.5),
        ),
      ],
    );
  }

  Widget _buildBottomFloatingNavBar(ThemeData theme) {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.vibrantGreen,
            AppTheme.vibrantGreen.withOpacity(0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(40),
        border: Border.all(
          color: Colors.white.withOpacity(0.45),
          width: 2.5,
        ),
        boxShadow: [
          // Raised 3D Drop Shadow
          BoxShadow(
            color: Colors.black.withOpacity(0.45),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
          // Inner/bottom ambient shading simulation
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 6,
            spreadRadius: -2,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // HOME TAB Icon (Spacious hit test button)
          Expanded(child: _buildNavBarItem(0, Icons.home_rounded, 'Home')),
          // SHOP TAB Icon (Spacious hit test button)
          Expanded(child: _buildNavBarItem(1, Icons.shopping_bag_rounded, 'Shop')),
          // SETTINGS TAB Icon (Spacious hit test button)
          Expanded(child: _buildNavBarItem(2, Icons.settings_rounded, 'Settings')),
        ],
      ),
    );
  }

  Widget _buildNavBarItem(int index, IconData icon, String label) {
    final isSelected = _currentTab == index;
    
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _currentTab = index;
        });
      },
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected 
                ? Colors.black.withOpacity(0.25) 
                : Colors.transparent,
            borderRadius: BorderRadius.circular(28),
            boxShadow: isSelected 
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.35),
                      offset: const Offset(0, 3),
                      blurRadius: 6,
                      spreadRadius: -1,
                    )
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF041E15),
                size: 26,
              ),
              if (isSelected) ...[
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShopScreen(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: widget.isDarkMode ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.01),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.shopping_bag, color: AppTheme.vibrantGreen),
              const SizedBox(width: 8),
              const Text('Premium Shop', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                _buildShopCard('Emerald Skin', '50 CLIP', Icons.style, Colors.emerald),
                _buildShopCard('Azure Theme', '100 CLIP', Icons.palette, Colors.blue),
                _buildShopCard('Unlimited Space', '250 CLIP', Icons.cloud, Colors.purple),
                _buildShopCard('Pro Voice Rec', '500 CLIP', Icons.mic, Colors.orange),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShopCard(String title, String cost, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 36, color: color),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text(cost, style: TextStyle(color: AppTheme.vibrantGreen, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsScreen(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
      ),
      child: ListView(
        children: [
          const Text('App Configurations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.brightness_2, color: AppTheme.vibrantGreen),
            title: const Text('Theme Mode'),
            subtitle: const Text('Gate.io Dark Charcoal (Locked)'),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.vibrantGreen.withOpacity(0.1),
                border: Border.all(color: AppTheme.vibrantGreen.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'ACTIVE',
                style: TextStyle(color: AppTheme.vibrantGreen, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.security, color: AppTheme.primaryBlue),
            title: const Text('Biometric Lock'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.backup, color: AppTheme.vibrantGreen),
            title: const Text('Cloud Sync State'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
`;
}

export function getFlutterNoteEditorCode(preset: FlutterCodePreset): string {
  const primaryColor = preset.primaryColorHex.replace('#', '0xFF');
  const accentColor = preset.accentColorHex.replace('#', '0xFF');

  return `// note_editor_screen.dart
import 'package:flutter/material.dart';
import 'theme.dart';

class NoteEditorScreen extends StatefulWidget {
  final String accountName;
  final int premiumCoins;

  const NoteEditorScreen({
    Key? key,
    required this.accountName,
    required this.premiumCoins,
  }) : super(key: key);

  @override
  State<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  final TextEditingController _titleController = TextEditingController(text: 'Gate.io Design Notes');
  final TextEditingController _contentController = TextEditingController(
    text: 'This UI integrates perfectly with Deep Blue primaries and Vibrant Green accents. '
         'All layout capsules, bottom navbar sheets, and quick row links are fully operational '
         'and scaled for extreme responsiveness on both handset ratios and foldables!'
  );

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Note'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.check, color: AppTheme.vibrantGreen),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Draft saved successfully!')),
              );
              Navigator.pop(context);
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Meta Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 8,
                        backgroundColor: AppTheme.vibrantGreen,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Category: Finance & UI',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : Colors.black54,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Last Edited: Just now',
                    style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38),
                  )
                ],
              ),
              const SizedBox(height: 18),
              
              // Note Title Input
              TextField(
                controller: _titleController,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
                decoration: const InputDecoration(
                  hintText: 'Enter title...',
                  border: InputBorder.none,
                ),
              ),
              const Divider(),
              const SizedBox(height: 10),

              // Note Body Input
              Expanded(
                child: TextField(
                  controller: _contentController,
                  maxLines: null,
                  keyboardType: TextInputType.multiline,
                  style: const TextStyle(fontSize: 16, height: 1.5),
                  decoration: const InputDecoration(
                    hintText: 'Type your thoughts here...',
                    border: InputBorder.none,
                  ),
                ),
              ),
              
              // Actions Info footer bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.security, color: AppTheme.vibrantGreen, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'SECURED & BACKED UP TO GATE.IO ACCOUNT',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                        color: isDark ? Colors.white70 : Colors.black80,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
}
