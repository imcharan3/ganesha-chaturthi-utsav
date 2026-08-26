package com.vijayacolony.ganesh2026;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Create High-Priority Notification Channels for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                // Default Channel
                NotificationChannel defaultChannel = new NotificationChannel(
                    "default",
                    "Ganesha Diaries Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                defaultChannel.setDescription("Live Laddu Auction, Chat and Devotional Alerts");
                defaultChannel.enableLights(true);
                defaultChannel.enableVibration(true);
                notificationManager.createNotificationChannel(defaultChannel);

                // Devotional Channel
                NotificationChannel devotionalChannel = new NotificationChannel(
                    "ganesh_devotional_alerts",
                    "Ganesha Utsav Live Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                );
                devotionalChannel.setDescription("Sacred Laddu Auction Bids & Pooja Announcements");
                devotionalChannel.enableLights(true);
                devotionalChannel.enableVibration(true);
                notificationManager.createNotificationChannel(devotionalChannel);
            }
        }

        // 2. Prompt native system notification permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }
}
