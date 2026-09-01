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
    [
        'key' => 'agents',
        'label' => 'Agents',
        'route' => '/agents',
        'sidebar' => true,
        'public' => false,
    ],
    [
        'key' => 'files',
        'label' => 'Files',
        'route' => '/files',
        'sidebar' => true,
        'public' => false,
    ],
];

