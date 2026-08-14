<?php


class Header{

    private $language;
    private $title;
    private $description;
    private $noIndex;

    private $cssFiles = [];
    private $jsFiles = [];

    public function setLanguage($language){
        if(!is_string($language)){
            throw new InvalidArgumentException('La langue doit être une chaîne de caractères.');
        }
        $this->language = $language;
    }

    public function setNoIndex(){
        $this->noIndex = 'TRUE';
    }

    public function setTitle($title){
        if(!is_string($title)){
            throw new InvalidArgumentException('Le titre doit être une chaîne de caractères.');
        }
        $this->title = $title;
    }

    public function setDescription($description){
        if(!is_string($description)){
            throw new InvalidArgumentException('La description doit être une chaîne de caractères.');
        }
        $this->description = $description;
    }
    public function addCssFile($cssFile){
        if(!is_string($cssFile)){
            throw new InvalidArgumentException('Le chemin du fichier CSS doit être une chaîne de caractères.');
        }
        $this->cssFiles[] = $cssFile;
    }

    public function addJsFile($jsFiles){
        if(!is_string($jsFiles)){
            throw new InvalidArgumentException('Le chemin du fichier JS doit être une chaîne de caractères.');
        }
        $this->jsFiles[] = $jsFiles;
    }

    public function getLanguage(){
        return $this->language;
    }

    public function getTitle(){
        return $this->title;
    }

    public function getDescription(){
        return $this->description;
    }
    
    public function getNoIndex(){

        if($this->noIndex === 'TRUE'){
            return '<meta name="robots" content="noindex">';
        }else{
            return '<meta name="robots" content="index, follow">';
        }
    }

    public function getCssFiles(){
        return $this->cssFiles;
    }

    public function getJsFiles(){
        return $this->jsFiles;
    }

    public function validateHeader(){

        if(!$this->language){
            throw new InvalidArgumentException('La langue n\'est pas définie.');
        }

        if(!$this->title){
            throw new InvalidArgumentException('Le titre n\'est pas défini.');
        }

        if(!$this->description){
            throw new InvalidArgumentException('La description n\'est pas définie.');
        }

    }

}

?>






