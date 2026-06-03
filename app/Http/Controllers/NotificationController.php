<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NotificationLog;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = NotificationLog::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        $unreadCount = NotificationLog::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    public function markRead(Request $request, $id)
    {
        NotificationLog::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'success']);
    }

    public function markAllRead(Request $request)
    {
        NotificationLog::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'success', 'message' => 'All notifications marked as read.']);
    }
}
