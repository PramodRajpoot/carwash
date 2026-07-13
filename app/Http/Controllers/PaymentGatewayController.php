<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentGateway;

class PaymentGatewayController extends Controller
{
    private $defaultGateways = [
        [
            'name' => 'Stripe',
            'slug' => 'stripe',
            'config' => [
                'public_key' => '',
                'secret_key' => ''
            ],
            'is_default' => true,
            'is_active' => true
        ],
        [
            'name' => 'Razorpay',
            'slug' => 'razorpay',
            'config' => [
                'key_id' => '',
                'key_secret' => ''
            ],
            'is_default' => true,
            'is_active' => false
        ],
        [
            'name' => 'PayPal',
            'slug' => 'paypal',
            'config' => [
                'client_id' => '',
                'client_secret' => '',
                'mode' => 'sandbox'
            ],
            'is_default' => true,
            'is_active' => false
        ]
    ];

    /**
     * Get all payment gateways
     */
    public function index()
    {
        // Seed default gateways if none exist
        if (PaymentGateway::count() === 0) {
            foreach ($this->defaultGateways as $gateway) {
                PaymentGateway::create($gateway);
            }
        }

        $gateways = PaymentGateway::all();
        return response()->json($gateways);
    }

    /**
     * Store a new custom gateway
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:payment_gateways,slug',
            'config' => 'nullable|array'
        ]);

        $gateway = PaymentGateway::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'config' => $request->config ?? [],
            'is_default' => false,
            'is_active' => false
        ]);

        return response()->json([
            'message' => 'Payment gateway added successfully',
            'gateway' => $gateway
        ]);
    }

    /**
     * Update an existing gateway
     */
    public function update(Request $request, $slug)
    {
        $gateway = PaymentGateway::where('slug', $slug)->firstOrFail();

        $request->validate([
            'name' => 'sometimes|string',
            'config' => 'nullable|array'
        ]);

        if ($request->has('name')) {
            $gateway->name = $request->name;
        }
        
        if ($request->has('config')) {
            $gateway->config = $request->config;
        }

        $gateway->save();

        return response()->json([
            'message' => 'Payment gateway updated successfully',
            'gateway' => $gateway
        ]);
    }

    /**
     * Set a gateway as active
     */
    public function activate($slug)
    {
        $gateway = PaymentGateway::where('slug', $slug)->firstOrFail();

        // Deactivate all others
        PaymentGateway::where('id', '!=', $gateway->id)->update(['is_active' => false]);
        
        // Activate selected
        $gateway->is_active = true;
        $gateway->save();

        return response()->json([
            'message' => $gateway->name . ' is now the active gateway.'
        ]);
    }

    /**
     * Delete a gateway
     */
    public function destroy($slug)
    {
        $gateway = PaymentGateway::where('slug', $slug)->firstOrFail();

        if ($gateway->is_default) {
            return response()->json([
                'message' => 'Default system gateways cannot be deleted.'
            ], 403);
        }

        if ($gateway->is_active) {
            return response()->json([
                'message' => 'Cannot delete the active gateway. Please activate another one first.'
            ], 400);
        }

        $gateway->delete();

        return response()->json([
            'message' => 'Payment gateway deleted successfully.'
        ]);
    }
}
