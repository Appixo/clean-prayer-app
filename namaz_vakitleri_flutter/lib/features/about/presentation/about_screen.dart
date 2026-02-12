import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_links.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  static Future<void> _openPrivacyPolicy(BuildContext context) async {
    final uri = Uri.parse(AppLinks.privacyPolicy);
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && context.mounted) {
        _showCouldNotOpenLink(context);
      }
    } catch (_) {
      if (context.mounted) _showCouldNotOpenLink(context);
    }
  }

  static void _showCouldNotOpenLink(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Bağlantı açılamadı. Lütfen daha sonra tekrar deneyin.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hakkında'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        minimum: EdgeInsets.only(top: 8),
        child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          12,
          24,
          24 + MediaQuery.of(context).viewPadding.bottom,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  Image.asset(
                    theme.brightness == Brightness.light
                        ? 'assets/images/logo-default.png'
                        : 'assets/images/logo-darkmode.png',
                    height: 96,
                    width: 96,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Icon(
                      LucideIcons.compass,
                      size: 96,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Namaz Vakitleri',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Sade ve güvenilir vakit takibi',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Uygulama Hakkında',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Namaz Vakitleri, günlük namaz vakitlerini kolayca takip etmenizi sağlayan bir uygulamadır. '
              'Konumunuzu seçerek veya GPS ile bulunduğunuz şehre göre Sabah, Güneş, Öğle, İkindi, Akşam ve Yatsı vakitlerini görüntüleyebilirsiniz.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Özellikler',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            _AboutItem(
              icon: LucideIcons.mapPin,
              text: 'Birden fazla konum kaydedebilir, şehir değiştirebilirsiniz.',
            ),
            _AboutItem(
              icon: LucideIcons.bell,
              text: 'Vakit bildirimleri ve isteğe bağlı ezan sesi.',
            ),
            _AboutItem(
              icon: LucideIcons.compass,
              text: 'Kıble yönü pusulası ile namaz kıble yönünü bulun.',
            ),
            _AboutItem(
              icon: LucideIcons.calendar,
              text: 'Hicri tarih ve dini günler.',
            ),
            _AboutItem(
              icon: LucideIcons.calculator,
              text: 'Diyanet İşleri Başkanlığı hesaplama yöntemi; Standart ve Hanefi İkindi seçenekleri.',
            ),
            const SizedBox(height: 24),
            Text(
              'Hesaplama',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Vakitler, Diyanet İşleri Başkanlığı\'nın kullandığı hesaplama yöntemine göre hesaplanır. '
              'Türkiye ve dünya genelinde birçok şehir için güncel vakit bilgisi sunulmaktadır.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Gizlilik',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _openPrivacyPolicy(context),
              borderRadius: BorderRadius.circular(8),
              child: _AboutItem(
                icon: LucideIcons.fileText,
                text: 'Gizlilik politikamızı okumak için tıklayın.',
              ),
            ),
            const SizedBox(height: 32),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Sürüm 1.0.0',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

class _AboutItem extends StatelessWidget {
  const _AboutItem({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
