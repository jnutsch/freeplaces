<?php
namespace ElasticExportFreieLagerort;
use ElasticExportFreieLagerort\Helper\PriceHelper;
use ElasticExportFreieLagerort\Helper\PropertyHelper;
use ElasticExportFreieLagerort\Helper\StockHelper;
use Plenty\Modules\DataExchange\Services\ExportPresetContainer;
use Plenty\Plugin\DataExchangeServiceProvider;
class ElasticExportFreieLagerortServiceProvider extends DataExchangeServiceProvider
{
    public function register()
    {
    }
    public function exports(ExportPresetContainer $container)
    {
        $container->add(
            'FreieLagerorte',
            'ElasticExportFreieLagerorte\ResultField\FreieLagerorte',
            'ElasticExportFreieLagerorte\Generator\FreieLagerorte',
            '',
            true,
            true
        );
    }
}