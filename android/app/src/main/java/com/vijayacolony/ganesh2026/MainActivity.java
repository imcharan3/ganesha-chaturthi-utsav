package com.vijayacolony.ganesh2026;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // 1. Create High-Priority Notification Channels for Android 8.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (notificationManager != null) {
                    NotificationChannel defaultChannel = new NotificationChannel(
                        "default",
                        "Ganesha Diaries Alerts",
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    defaultChannel.setDescription("Live Laddu Auction, Chat and Devotional Alerts");
                    defaultChannel.enableLights(true);
                    defaultChannel.enableVibration(true);
                    notificationManager.createNotificationChannel(defaultChannel);

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

            // 2. Set WebView Download Listener
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                    try {
                        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                        intent.setData(android.net.Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
