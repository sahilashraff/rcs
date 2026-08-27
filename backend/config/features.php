<?php

return [
    [
        'key' => 'dashboard',
        'label' => 'Dashboard',
        'route' => '/home',
        'sidebar' => true,
        'public' => true,
    ],
    [
        'key' => 'permissions',
        'label' => 'Sub-Accounts & Permissions',
        'route' => '/permissions',
        'sidebar' => true,
        'public' => false,
    ],
];
