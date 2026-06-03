<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SupportTicket;

class SupportTicketController extends Controller
{
    // Customer: list own tickets
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('customer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    // Customer: create ticket
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);

        $ticket = SupportTicket::create([
            'customer_id' => $request->user()->id,
            'subject'     => $request->subject,
            'body'        => $request->body,
            'status'      => 'open',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Support ticket created successfully.',
            'ticket'  => $ticket,
        ], 201);
    }

    // Customer: view single ticket
    public function show(Request $request, $id)
    {
        $ticket = SupportTicket::where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($ticket);
    }

    // Admin: list all tickets
    public function adminIndex(Request $request)
    {
        $tickets = SupportTicket::with('customer:id,name,email,phone')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    // Admin: reply and change status
    public function adminUpdate(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);

        $request->validate([
            'status'      => 'nullable|string|in:open,in_progress,closed',
            'admin_reply' => 'nullable|string',
        ]);

        $ticket->update([
            'status'      => $request->input('status', $ticket->status),
            'admin_reply' => $request->admin_reply,
            'replied_at'  => $request->admin_reply ? now() : $ticket->replied_at,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Ticket updated.',
            'ticket'  => $ticket->load('customer:id,name,email'),
        ]);
    }
}
