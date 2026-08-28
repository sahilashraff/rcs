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
        'label' => 'Team',
        'route' => '/permissions',
        'sidebar' => true,
        'public' => false,
        'owner_only' => true,
    ],
];
