@echo off
echo Creating images directory...
mkdir images 2>nul

echo Copying user uploaded portrait...
copy "C:\Users\sjado\.gemini\antigravity\brain\d564f0b1-11e3-4bb6-85de-acafb345faa7\media__1781275539974.jpg" "images\portrait.jpg" /Y

echo Copying project mockups...
copy "C:\Users\sjado\.gemini\antigravity\brain\d564f0b1-11e3-4bb6-85de-acafb345faa7\project_app_1781274369475.png" "images\project1.png" /Y
copy "C:\Users\sjado\.gemini\antigravity\brain\d564f0b1-11e3-4bb6-85de-acafb345faa7\project_dashboard_1781274387860.png" "images\project2.png" /Y
copy "C:\Users\sjado\.gemini\antigravity\brain\d564f0b1-11e3-4bb6-85de-acafb345faa7\project_website_1781274404364.png" "images\project3.png" /Y

echo All assets copied successfully!
pause
