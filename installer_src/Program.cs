using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;

namespace AntigravityLocalizer
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.Title = "Локализатор интерфейса Antigravity 2.0 (RU, UK, KK, BE, UZ)";

            bool silent = false;
            bool restore = false;
            string customPath = null;

            foreach (string arg in args)
            {
                if (arg.Equals("/s", StringComparison.OrdinalIgnoreCase) || arg.Equals("-s", StringComparison.OrdinalIgnoreCase) || arg.Equals("--silent", StringComparison.OrdinalIgnoreCase))
                    silent = true;
                else if (arg.Equals("/r", StringComparison.OrdinalIgnoreCase) || arg.Equals("-r", StringComparison.OrdinalIgnoreCase) || arg.Equals("--restore", StringComparison.OrdinalIgnoreCase))
                    restore = true;
                else if (Directory.Exists(arg))
                    customPath = arg;
            }

            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("==================================================================");
            Console.WriteLine("   Локализатор интерфейса Antigravity 2.0 (СНГ & Multi-Language)");
            Console.WriteLine("==================================================================");
            Console.ResetColor();
            Console.WriteLine();

            // 1. Locate Antigravity installation
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string appDir = customPath;
            if (string.IsNullOrEmpty(appDir))
            {
                appDir = Path.Combine(localAppData, "Programs", "antigravity");
            }

            string resourcesDir = Path.Combine(appDir, "resources");
            string asarPath = Path.Combine(resourcesDir, "app.asar");
            string backupPath = Path.Combine(resourcesDir, "app.asar.bak");
            string exePath = Path.Combine(appDir, "Antigravity.exe");

            if (!Directory.Exists(resourcesDir))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[ОШИБКА] Каталог Antigravity не найден: " + appDir);
                Console.WriteLine("[ИНФО] Если Antigravity установлена в другой папке, запустите установщик с указанием пути:");
                Console.WriteLine("       AntigravityLocalizerSetup.exe \"C:\\Путь\\К\\antigravity\"");
                Console.ResetColor();
                if (!silent) Pause();
                return;
            }

            Console.WriteLine("[*] Найдена установка Antigravity: " + appDir);

            // Handle Restore
            if (restore)
            {
                if (!File.Exists(backupPath))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ОШИБКА] Резервная копия не найдена: " + backupPath);
                    Console.ResetColor();
                    if (!silent) Pause();
                    return;
                }

                KillAntigravity();
                try
                {
                    File.Copy(backupPath, asarPath, true);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[УСПЕХ] Оригинальный интерфейс Antigravity успешно восстановлен!");
                    Console.ResetColor();
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ОШИБКА] Не удалось восстановить файл: " + ex.Message);
                    Console.ResetColor();
                }
                if (!silent) Pause();
                return;
            }

            // 2. Kill running processes
            KillAntigravity();

            // 3. Clean updater pending cache to prevent rollback on exit
            try
            {
                string updaterDir = Path.Combine(localAppData, "antigravity-updater");
                string pendingDir = Path.Combine(updaterDir, "pending");
                string installerExe = Path.Combine(updaterDir, "installer.exe");

                if (File.Exists(installerExe))
                {
                    try { File.Delete(installerExe); } catch { }
                }

                if (Directory.Exists(pendingDir))
                {
                    foreach (string file in Directory.GetFiles(pendingDir))
                    {
                        try { File.Delete(file); } catch { }
                    }
                }
                Console.WriteLine("[*] Кеш автообновлений очищен (защита от перезаписи на выходе).");
            }
            catch { }

            // 4. Create backup if missing
            if (!File.Exists(backupPath) && File.Exists(asarPath))
            {
                Console.WriteLine("[*] Создание резервной копии оригинального интерфейса (app.asar.bak)...");
                try
                {
                    File.Copy(asarPath, backupPath, true);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[*] Резервная копия создана.");
                    Console.ResetColor();
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("[!] Предупреждение: Не удалось создать бэкап: " + ex.Message);
                    Console.ResetColor();
                }
            }

            // 5. Extract and apply patched app.asar from embedded resource
            Console.WriteLine("[*] Установка локализатора и языковых пакетов...");
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                using (Stream resStream = asm.GetManifestResourceStream("Payload"))
                {
                    if (resStream == null)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("[ОШИБКА] Встроенный пакет локализации не найден в установщике!");
                        Console.ResetColor();
                        if (!silent) Pause();
                        return;
                    }

                    using (ZipArchive archive = new ZipArchive(resStream, ZipArchiveMode.Read))
                    {
                        ZipArchiveEntry entry = archive.Entries[0];
                        string tempFile = Path.Combine(resourcesDir, "app.asar.new_" + Guid.NewGuid().ToString("N"));

                        entry.ExtractToFile(tempFile, true);

                        // Swap file safely
                        int attempts = 0;
                        bool success = false;
                        while (attempts < 5)
                        {
                            try
                            {
                                File.Copy(tempFile, asarPath, true);
                                File.Delete(tempFile);
                                success = true;
                                break;
                            }
                            catch
                            {
                                attempts++;
                                Thread.Sleep(800);
                            }
                        }

                        if (!success)
                        {
                            throw new Exception("Файл app.asar заблокирован другим процессом. Закройте Antigravity и повторите запуск.");
                        }
                    }
                }

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[УСПЕХ] Локализатор успешно установлен в Antigravity!");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[ОШИБКА] Сбой при установке: " + ex.Message);
                Console.ResetColor();
                if (!silent) Pause();
                return;
            }

            // 6. Launch Antigravity completely detached via Windows Explorer
            if (File.Exists(exePath))
            {
                Console.WriteLine("[*] Запуск Antigravity с новым интерфейсом...");
                try
                {
                    Process.Start("explorer.exe", "\"" + exePath + "\"");
                }
                catch
                {
                    try { Process.Start(exePath); } catch { }
                }
            }

            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================================");
            Console.WriteLine(" Готово! Все настройки и функции интерфейса переведены.");
            Console.WriteLine(" В верхней панели навигации доступен переключатель языков:");
            Console.WriteLine(" 🇷🇺 Русский | 🇺🇦 Українська | 🇰🇿 Қазақша | 🇧🇾 Беларуская | 🇺🇿 O'zbekcha");
            Console.WriteLine(" Горячая клавиша для смены языка: Alt + L");
            Console.WriteLine("==================================================================");
            Console.ResetColor();
            Console.WriteLine();

            if (!silent) Pause();
        }

        static void KillAntigravity()
        {
            Process[] procs = Process.GetProcessesByName("Antigravity");
            if (procs.Length > 0)
            {
                Console.WriteLine("[*] Закрытие запущенных процессов Antigravity...");
                foreach (Process p in procs)
                {
                    try
                    {
                        p.Kill();
                        p.WaitForExit(3000);
                    }
                    catch { }
                }
                Thread.Sleep(1000);
            }
        }

        static void Pause()
        {
            Console.WriteLine("Окно закроется автоматически через 3 секунды (или нажмите любую клавишу)...");
            int waited = 0;
            while (waited < 30)
            {
                try
                {
                    if (Console.KeyAvailable)
                    {
                        Console.ReadKey(true);
                        break;
                    }
                }
                catch { break; }
                Thread.Sleep(100);
                waited++;
            }
        }
    }
}
