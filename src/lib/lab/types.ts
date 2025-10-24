import { ReactElement } from "react";

export type TType = "string" | "number" | "color" | "boolean" | "select" | "group";

export type ICondition = {
    name: string;
    equal?: Array<string | number | boolean>;
    notEqual?: Array<string | number | boolean>;
    exists?: boolean;
};

export interface IBaseProperty<T> {
    name: string;
    label: string;
    type: TType;
    value?: T;
    dynamic?: boolean;
    hidden?: true | undefined;
    hiddenIf?: ICondition[];
    displayIf?: ICondition[];
    select?: string[];
    selectValue?: string;
}

export interface IComponentPropertiesProps extends IBaseProperty<string | number | boolean> { }

export interface IComponentsStyleProps extends IBaseProperty<string | number | boolean> {
    children?: IComponentsStyleProps[];
}

export interface IComponentProps {
    id: string;
    name: string;
    icon: ReactElement;
    type?: "layout" | "widget";
    props?: [IComponentPropertiesProps, ...IComponentPropertiesProps[]] | IComponentPropertiesProps[];
    style?: [IComponentsStyleProps, ...IComponentsStyleProps[]] | IComponentsStyleProps[] | string[];
    container?: boolean;
    resize?: boolean;
}

export type IComponentsDualProps = IComponentProps | IComponentProps[];

export type JSONNode = {
    id: string; 
    type: string;
    name: string;
    resize?: boolean;
    container?: boolean;
    props: Record<string, any>;
    style: Record<string, any>;
    children: JSONNode[];
};

export type Path = number[];
