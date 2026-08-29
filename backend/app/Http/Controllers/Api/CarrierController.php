<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carrier;
use Illuminate\Http\Request;

class CarrierController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Carrier::query()->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:carriers,code'],
            'name' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:2'],
        ]);

        $carrier = Carrier::create($data);

        return response()->json(['data' => $carrier], 201);
    }

    public function update(Request $request, Carrier $carrier)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'country' => ['sometimes', 'string', 'max:2'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $carrier->update($data);

        return response()->json(['data' => $carrier]);
    }
}
